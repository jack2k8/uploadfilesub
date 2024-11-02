export class Downloader {
  constructor(fileSystem) {
    this.fileSystem = fileSystem;
  }

  downloadFile(item) {
    const blob = this.createBlob(item);
    this.triggerDownload(blob, item.name);
  }

  downloadFolder(folderPath, folderName) {
    const folder = this.fileSystem.navigateToPath(folderPath);
    if (!folder) return;

    const zip = new JSZip();
    this.addFolderToZip(zip, folder);

    zip.generateAsync({ type: 'blob' })
      .then(blob => {
        this.triggerDownload(blob, `${folderName}.zip`);
      });
  }

  createBlob(item) {
    if (item.fileType.startsWith('image/')) {
      // For base64 images
      const base64Data = item.content.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        byteArrays.push(new Uint8Array(byteNumbers));
      }

      return new Blob(byteArrays, { type: item.fileType });
    }

    return new Blob([item.content], { type: 'text/plain' });
  }

  addFolderToZip(zip, folder, currentPath = '') {
    for (const [name, item] of Object.entries(folder.children)) {
      const itemPath = currentPath ? `${currentPath}/${name}` : name;

      if (item.type === 'folder') {
        this.addFolderToZip(zip, item, itemPath);
      } else {
        if (item.fileType.startsWith('image/')) {
          const base64Data = item.content.split(',')[1];
          zip.file(itemPath, base64Data, { base64: true });
        } else {
          zip.file(itemPath, item.content);
        }
      }
    }
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}