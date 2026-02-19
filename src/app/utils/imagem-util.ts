import { environment } from 'src/environments/environment';

export class ImagemUtil {

    /**
     * Converte base64 para Blob
     */
    static base64ParaBlob(base64: string, tipo: string): Blob {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: tipo });
    }

    static processarImagemSelecionada(
        file: File,
        alturaFinal: number = 300,
        larguraFinal: number = 300,
        qualidade: number = 0.8
    ): Promise<{ preview: string; blob: Blob }> {
        return new Promise((resolve, reject) => {
            if (!file) return reject('Arquivo inválido');
    
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
            if (!tiposPermitidos.includes(file.type)) {
                return reject('Formato de imagem inválido');
            }
    
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = larguraFinal;
                    canvas.height = alturaFinal;
    
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    
                    const scale = Math.max(larguraFinal / img.width, alturaFinal / img.height);
                    const newWidth = img.width * scale;
                    const newHeight = img.height * scale;
                    const offsetX = (larguraFinal - newWidth) / 2;
                    const offsetY = (alturaFinal - newHeight) / 2;
    
                    ctx?.drawImage(img, offsetX, offsetY, newWidth, newHeight);
    
                    const base64 = canvas.toDataURL(file.type, qualidade);
                    const blob = this.base64ParaBlob(base64, file.type);
    
                    resolve({ preview: base64, blob });
                };
                img.onerror = reject;
                img.src = reader.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }    

    /**
     * Monta a URL da imagem de perfil
     */
    static montarUrlImagemPerfil(nomeImagem: string | null | undefined): string {
        const baseUrl = environment.apiUrl;
        return nomeImagem
            ? `${baseUrl}/api/imagens/perfil/${nomeImagem}`
            : 'assets/images/profile/user-1.jpg';
    }

    /**
     * Monta a URL da logo da empresa
     */
    static montarUrlImagemLogo(nomeImagem: string | null | undefined): string {
        const baseUrl = environment.apiUrl;
        return nomeImagem
          ? `${baseUrl}/api/imagens/logo/${nomeImagem}`
          : './assets/images/logos/LogoPadrao.png';
      }
      
}