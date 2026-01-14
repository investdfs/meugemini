
import CryptoJS from 'crypto-js';

export class SecurityService {
  /**
   * Criptografa um objeto usando uma senha mestra.
   */
  static encrypt(data: any, password: string): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, password).toString();
  }

  /**
   * Descriptografa uma string usando uma senha mestra.
   * Retorna null se a senha estiver incorreta.
   */
  static decrypt(ciphertext: string, password: string): any | null {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, password);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) return null;
      return JSON.parse(decryptedData);
    } catch (e) {
      return null;
    }
  }

  /**
   * Verifica se a senha é válida tentando descriptografar um valor de teste.
   */
  static validatePassword(ciphertext: string, password: string): boolean {
    return this.decrypt(ciphertext, password) !== null;
  }
}
