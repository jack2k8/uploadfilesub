export class DragDropHandler {
  constructor(fileSystem) {
    this.fileSystem = fileSystem;
    this.draggedItem = null;
  }

  setupDraggable(element) {
    element.addEventListener('dragstart', (e) => {
      this.draggedItem = {
        name: element.dataset.name,
        type: element.dataset.type
      };
      e.dataTransfer.effectAllowed = 'move';
      element.classList.add('dragging');
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      this.draggedItem = null;
    });
  }

  setupDropZone(element, targetPath) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');

      if (this.draggedItem) {
        this.handleInternalDrop(targetPath);
      } else if (e.dataTransfer.files.length > 0) {
        this.handleExternalDrop(e.dataTransfer.files, targetPath);
      }
    });
  }

  async handleInternalDrop(targetPath) {
    if (!this.draggedItem || this.fileSystem.isReadOnly()) return;

    const sourcePath = window.currentPath;
    const sourceFolder = this.fileSystem.navigateToPath(sourcePath);
    const item = sourceFolder.children[this.draggedItem.name];

    if (sourcePath === targetPath) return;

    if (this.draggedItem.type === 'folder') {
      this.fileSystem.createFolder(targetPath, this.draggedItem.name);
      this.copyFolderContents(item, `${targetPath}/${this.draggedItem.name}`);
    } else {
      this.fileSystem.createFile(
        targetPath,
        this.draggedItem.name,
        item.content,
        item.fileType
      );
    }

    delete sourceFolder.children[this.draggedItem.name];
    window.updateUI();
  }

  copyFolderContents(sourceFolder, targetPath) {
    for (const [name, item] of Object.entries(sourceFolder.children)) {
      if (item.type === 'folder') {
        this.fileSystem.createFolder(targetPath, name);
        this.copyFolderContents(item, `${targetPath}/${name}`);
      } else {
        this.fileSystem.createFile(targetPath, name, item.content, item.fileType);
      }
    }
  }

  async handleExternalDrop(files, targetPath) {
    if (this.fileSystem.isReadOnly()) return;
    
    const uploader = new FileUploader(this.fileSystem);
    await uploader.handleFileUpload(files, targetPath);
    window.updateUI();
  }
}