import { IPublicApiCommonUI, IPublicModelPluginContext, IPublicTypeContextMenuAction } from '@alilc/lowcode-types';
import {
  HelpTip,
  IEditor,
  Tip as InnerTip,
  Title as InnerTitle,
 } from '@alilc/lowcode-editor-core';
import { Balloon, Breadcrumb, Button, Card, Checkbox, DatePicker, Dialog, Dropdown, Form, Icon, Input, Loading, Message, Overlay, Pagination, Radio, Search, Select, SplitButton, Step, Switch, Tab, Table, Tree, TreeSelect, Upload, Divider } from '@alifd/next';
import { ContextMenu } from '../components/context-menu';
import { editorSymbol } from '../symbols';
import { ReactElement } from 'react';

export class CommonUI implements IPublicApiCommonUI {
  [editorSymbol]: IEditor;

  get Balloon() {
    return Balloon as any;
  }

  get Breadcrumb() {
    return Breadcrumb as any;
  }

  get Button() {
    return Button as any;
  }

  get Card() {
    return Card as any;
  }

  get Checkbox() {
    return Checkbox as any;
  }

  get DatePicker() {
    return DatePicker as any;
  }

  get Dialog() {
    return Dialog as any;
  }

  get Dropdown() {
    return Dropdown as any;
  }

  get Form() {
    return Form as any;
  }

  get Icon() {
    return Icon as any;
  }

  get Input() {
    return Input as any;
  }

  get Loading() {
    return Loading as any;
  }

  get Message() {
    return Message as any;
  }

  get Overlay() {
    return Overlay as any;
  }

  get Pagination() {
    return Pagination as any;
  }

  get Radio() {
    return Radio as any;
  }

  get Search() {
    return Search as any;
  }

  get Select() {
    return Select as any;
  }

  get SplitButton() {
    return SplitButton as any;
  }

  get Step() {
    return Step as any;
  }

  get Switch() {
    return Switch as any;
  }

  get Tab() {
    return Tab as any;
  }

  get Table() {
    return Table as any;
  }

  get Tree() {
    return Tree as any;
  }

  get TreeSelect() {
    return TreeSelect as any;
  }

  get Upload() {
    return Upload as any;
  }

  get Divider() {
    return Divider as any;
  }

  ContextMenu: ((props: {
    menus: IPublicTypeContextMenuAction[];
    children: React.ReactElement[] | React.ReactElement;
  }) => ReactElement) & {
    create(menus: IPublicTypeContextMenuAction[], event: MouseEvent | React.MouseEvent): void;
  };

  constructor(editor: IEditor) {
    this[editorSymbol] = editor;

    const innerContextMenu = (props: any) => {
      const pluginContext: IPublicModelPluginContext = editor.get('pluginContext') as IPublicModelPluginContext;
      return <ContextMenu {...props} pluginContext={pluginContext} />;
    };

    innerContextMenu.create = (menus: IPublicTypeContextMenuAction[], event: MouseEvent) => {
      const pluginContext: IPublicModelPluginContext = editor.get('pluginContext') as IPublicModelPluginContext;
      return ContextMenu.create(pluginContext, menus, event);
    };

    this.ContextMenu = innerContextMenu;
  }

  get Tip() {
    return InnerTip;
  }

  get HelpTip() {
    return HelpTip;
  }

  get Title() {
    return InnerTitle;
  }
}
