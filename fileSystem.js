export class FileSystem {
  constructor() {
    this.root = {
      name: 'root',
      type: 'folder',
      children: {},
    };
    this.readOnlyMode = false;
  }

  setReadOnlyMode(value) {
    this.readOnlyMode = value;
  }

  isReadOnly() {
    return this.readOnlyMode;
  }

  createFolder(path, name) {
    if (this.readOnlyMode) return false;
    const parent = this.navigateToPath(path);
    if (!parent) return false;
    
    parent.children[name] = {
      name,
      type: 'folder',
      children: {},
    };
    return true;
  }

  createFile(path, name, content = '', type = '') {
    if (this.readOnlyMode) return false;
    const parent = this.navigateToPath(path);
    if (!parent) return false;
    
    parent.children[name] = {
      name,
      type: 'file',
      content,
      fileType: type
    };
    return true;
  }

  rename(path, oldName, newName) {
    if (this.readOnlyMode) return false;
    const parent = this.navigateToPath(path);
    if (!parent || !parent.children[oldName]) return false;
    
    parent.children[newName] = parent.children[oldName];
    parent.children[newName].name = newName;
    delete parent.children[oldName];
    return true;
  }

  navigateToPath(path) {
    if (path === '/') return this.root;
    
    const parts = path.split('/').filter(Boolean);
    let current = this.root;
    
    for (const part of parts) {
      if (!current.children[part]) return null;
      current = current.children[part];
    }
    
    return current;
  }

  exportState() {
    return JSON.stringify(this.root);
  }

  importState(state) {
    try {
      this.root = JSON.parse(state);
      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  }
}