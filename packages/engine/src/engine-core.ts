/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import {
  globalContext,
  Editor,
  commonEvent,
  engineConfig,
  Setters as InnerSetters,
  Hotkey as InnerHotkey,
  IEditor,
  Command as InnerCommand,
} from '@alilc/lowcode-editor-core';
import {
  IPublicTypeEngineOptions,
  IPublicModelDocumentModel,
  IPublicTypePluginMeta,
  IPublicTypeDisposable,
  IPublicApiPlugins,
  IPublicApiWorkspace,
  IPublicEnumPluginRegisterLevel,
  IPublicModelPluginContext,
} from '@alilc/lowcode-types';
import {
  Designer,
  LowCodePluginManager,
  ILowCodePluginContextPrivate,
  ILowCodePluginContextApiAssembler,
  PluginPreference,
  IDesigner,
} from '@alilc/lowcode-designer';
import {
  Skeleton as InnerSkeleton,
  ISkeleton,
  registerDefaults,
} from '@alilc/lowcode-editor-skeleton';
import {
  Workspace as InnerWorkspace,
  Workbench as WorkSpaceWorkbench,
  IWorkspace,
} from '@alilc/lowcode-workspace';

import {
  Hotkey,
  Project,
  Skeleton,
  Setters,
  Material,
  Event,
  Plugins,
  Common,
  Logger,
  Canvas,
  Workspace,
  Config,
  CommonUI,
  Command,
} from '@alilc/lowcode-shell';
import { isPlainObject } from '@alilc/lowcode-utils';
import './modules/live-editing';
import * as classes from './modules/classes';
import symbols from './modules/symbols';
import { componentMetaParser } from './inner-plugins/component-meta-parser';
import { setterRegistry } from './inner-plugins/setter-registry';
import { defaultPanelRegistry } from './inner-plugins/default-panel-registry';
import { shellModelFactory } from './modules/shell-model-factory';
import { builtinHotkey } from './inner-plugins/builtin-hotkey';
import { defaultContextMenu } from './inner-plugins/default-context-menu';
import { CommandPlugin } from '@alilc/lowcode-plugin-command';
import { OutlinePlugin } from '@alilc/lowcode-plugin-outline-pane';

export * from './modules/skeleton-types';
export * from './modules/designer-types';
export * from './modules/lowcode-types';

// @ts-ignore webpack Define variable
export const version = VERSION_PLACEHOLDER;
engineConfig.set('ENGINE_VERSION', version);

// declare this is open-source version
export const isOpenSource = true;
engineConfig.set('isOpenSource', isOpenSource);

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  symbols,
  classes,
};

async function registryInnerPlugin(designer: IDesigner, editor: IEditor, plugins: IPublicApiPlugins): Promise<IPublicTypeDisposable> {
  // 注册一批内置插件
  const componentMetaParserPlugin = componentMetaParser(designer);
  const defaultPanelRegistryPlugin = defaultPanelRegistry(editor);
  await plugins.register(OutlinePlugin, {}, { autoInit: true });
  await plugins.register(componentMetaParserPlugin);
  await plugins.register(setterRegistry, {});
  await plugins.register(defaultPanelRegistryPlugin);
  await plugins.register(builtinHotkey);
  await plugins.register(registerDefaults, {}, { autoInit: true });
  await plugins.register(defaultContextMenu);
  await plugins.register(CommandPlugin, {});

  return () => {
    plugins.delete(OutlinePlugin.pluginName);
    plugins.delete(componentMetaParserPlugin.pluginName);
    plugins.delete(setterRegistry.pluginName);
    plugins.delete(defaultPanelRegistryPlugin.pluginName);
    plugins.delete(builtinHotkey.pluginName);
    plugins.delete(registerDefaults.pluginName);
    plugins.delete(defaultContextMenu.pluginName);
    plugins.delete(CommandPlugin.pluginName);
  };
}

export class Engine {
  // container which will host LowCodeEngine DOM
  private engineContainer: HTMLElement | null = null;
  private pluginPromise: Promise<IPublicTypeDisposable> | null = null;

  // Core instances
  private innerWorkspace: IWorkspace;
  private workspace: IPublicApiWorkspace;
  private editor: IEditor;
  private engineContext: Partial<ILowCodePluginContextPrivate> = {};
  private innerSkeleton: InnerSkeleton;
  private designer: IDesigner;
  private innerProject: any;
  private innerHotkey: InnerHotkey;
  private hotkey: Hotkey;
  private project: Project;
  private skeleton: Skeleton;
  private innerSetters: InnerSetters;
  private setters: Setters;
  private innerCommand: InnerCommand;
  private command: Command;
  private material: Material;
  private commonUI: CommonUI;
  private config: Config;
  private event: Event;
  private logger: Logger;
  private common: Common;
  private canvas: Canvas;
  private plugins: Plugins;

  constructor() {
    // Initialize core instances
    this.editor = new Editor();
    this.innerWorkspace = new InnerWorkspace(registryInnerPlugin, shellModelFactory) as unknown as IWorkspace;
    this.workspace = new Workspace(this.innerWorkspace);

    globalContext.register(this.editor, Editor);
    globalContext.register(this.editor, 'editor');
    globalContext.register(this.innerWorkspace, 'workspace');

    this.innerSkeleton = new InnerSkeleton(this.editor);
    this.editor.set('skeleton' as any, this.innerSkeleton);

    this.designer = new Designer({ editor: this.editor, shellModelFactory }) as unknown as IDesigner;
    this.editor.set('designer' as any, this.designer);

    this.innerProject = this.designer.project;

    this.innerHotkey = new InnerHotkey();
    this.hotkey = new Hotkey(this.innerHotkey);
    this.project = new Project(this.innerProject);
    this.skeleton = new Skeleton(this.innerSkeleton as unknown as ISkeleton, 'any', false);
    this.innerSetters = new InnerSetters();
    this.setters = new Setters(this.innerSetters);
    this.innerCommand = new InnerCommand();
    this.command = new Command(this.innerCommand, this.engineContext as IPublicModelPluginContext);

    this.material = new Material(this.editor);
    this.commonUI = new CommonUI(this.editor);
    this.editor.set('project', this.project);
    this.editor.set('setters' as any, this.setters);
    this.editor.set('material', this.material);
    this.editor.set('innerHotkey', this.innerHotkey);
    this.config = new Config(engineConfig);
    this.event = new Event(commonEvent, { prefix: 'common' });
    this.logger = new Logger({ level: 'warn', bizName: 'common' });
    this.common = new Common(this.editor as Editor, this.innerSkeleton);
    this.canvas = new Canvas(this.editor);

    const pluginContextApiAssembler: ILowCodePluginContextApiAssembler = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      assembleApis: (context: ILowCodePluginContextPrivate, pluginName: string, meta: IPublicTypePluginMeta) => {
        context.hotkey = this.hotkey;
        context.project = this.project;
        context.skeleton = new Skeleton(this.innerSkeleton as unknown as ISkeleton, pluginName, false);
        context.setters = this.setters;
        context.material = this.material;
        const eventPrefix = meta?.eventPrefix || 'common';
        const commandScope = meta?.commandScope;
        context.event = new Event(commonEvent, { prefix: eventPrefix });
        context.config = this.config;
        context.common = this.common;
        context.canvas = this.canvas;
        context.plugins = this.plugins;
        context.logger = new Logger({ level: 'warn', bizName: `plugin:${pluginName}` });
        context.workspace = this.workspace;
        context.commonUI = this.commonUI;
        context.command = new Command(this.innerCommand, context as IPublicModelPluginContext, {
          commandScope,
        });
        context.registerLevel = IPublicEnumPluginRegisterLevel.Default;
        context.isPluginRegisteredInWorkspace = false;
        this.editor.set('pluginContext', context);
      },
    };

    const innerPlugins = new LowCodePluginManager(pluginContextApiAssembler);
    this.plugins = new Plugins(innerPlugins).toProxy();
    this.editor.set('innerPlugins' as any, innerPlugins);
    this.editor.set('plugins' as any, this.plugins);

    this.engineContext.skeleton = this.skeleton;
    this.engineContext.plugins = this.plugins;
    this.engineContext.project = this.project;
    this.engineContext.setters = this.setters;
    this.engineContext.material = this.material;
    this.engineContext.event = this.event;
    this.engineContext.logger = this.logger;
    this.engineContext.hotkey = this.hotkey;
    this.engineContext.common = this.common;
    this.engineContext.workspace = this.workspace;
    this.engineContext.canvas = this.canvas;
    this.engineContext.commonUI = this.commonUI;
    this.engineContext.command = this.command;

    this.pluginPromise = registryInnerPlugin(this.designer, this.editor, this.plugins as any);
  }

  // Public APIs
  get Skeleton() {
    return this.skeleton;
  }

  get Plugins() {
    return this.plugins;
  }

  get Project() {
    return this.project;
  }

  get Setters() {
    return this.setters;
  }

  get Material() {
    return this.material;
  }

  get Config() {
    return this.config;
  }

  get Event() {
    return this.event;
  }

  get Logger() {
    return this.logger;
  }

  get Hotkey() {
    return this.hotkey;
  }

  get Common() {
    return this.common;
  }

  get Workspace() {
    return this.workspace;
  }

  get Canvas() {
    return this.canvas;
  }

  get CommonUI() {
    return this.commonUI;
  }

  get Command() {
    return this.command;
  }

  async init(
    container?: HTMLElement,
    options?: IPublicTypeEngineOptions,
    pluginPreference?: PluginPreference,
  ) {
    await this.destroy();
    let engineOptions = null;
    if (isPlainObject(container)) {
      engineOptions = container;
      this.engineContainer = document.createElement('div');
      this.engineContainer.id = 'engine';
      document.body.appendChild(this.engineContainer);
    } else {
      engineOptions = options;
      this.engineContainer = container || document.createElement('div');
      if (!container) {
        (this.engineContainer as HTMLElement).id = 'engine';
        document.body.appendChild(this.engineContainer);
      }
    }
    engineConfig.setEngineOptions(engineOptions as any);

    const { Workbench } = this.common.skeletonCabin;
    if (options && options.enableWorkspaceMode) {
      const disposeFun = await this.pluginPromise;
      disposeFun && disposeFun();
      render(
      createElement(WorkSpaceWorkbench, {
        workspace: this.innerWorkspace as any,
        className: 'engine-main',
        topAreaItemClassName: 'engine-actionitem',
      }),
      this.engineContainer!,
    );
      this.innerWorkspace.enableAutoOpenFirstWindow = engineConfig.get('enableAutoOpenFirstWindow', true);
      this.innerWorkspace.setActive(true);
      this.innerWorkspace.initWindow();
      this.innerHotkey.activate(false);
      await this.innerWorkspace.plugins.init(pluginPreference);
      return;
    }

    await this.plugins.init(pluginPreference as any);

    render(
      createElement(Workbench, {
        skeleton: this.innerSkeleton as any,
        className: 'engine-main',
        topAreaItemClassName: 'engine-actionitem',
      }),
      this.engineContainer!,
    );
  }

  async destroy() {
    // remove all documents
    const { documents } = this.project;
    if (Array.isArray(documents) && documents.length > 0) {
      documents.forEach(((doc: IPublicModelDocumentModel) => this.project.removeDocument(doc)));
    }

    // TODO: delete plugins except for core plugins

    // unmount DOM container, this will trigger React componentWillUnmount lifeCycle,
    // so necessary cleanups will be done.
    if (this.engineContainer) {
      unmountComponentAtNode(this.engineContainer);
      // Remove container if it was created by us
      if (this.engineContainer.id === 'engine' && this.engineContainer.parentNode === document.body) {
        document.body.removeChild(this.engineContainer);
      }
      this.engineContainer = null;
    }
  }
}

