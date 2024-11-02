export class FileUploader {
  constructor(fileSystem) {
    this.fileSystem = fileSystem;
  }

  async handleFileUpload(files, currentPath) {
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        this.fileSystem.createFile(currentPath, file.name, content, file.type);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  }
}