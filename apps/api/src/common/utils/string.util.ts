export class StringUtil {
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static titleCase(str: string): string {
    if (!str) return str;
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  static camelCase(str: string): string {
    if (!str) return str;
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, '');
  }

  static pascalCase(str: string): string {
    if (!str) return str;
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
      word.toUpperCase()
    ).replace(/\s+/g, '');
  }

  static snakeCase(str: string): string {
    if (!str) return str;
    return str.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  static kebabCase(str: string): string {
    if (!str) return str;
    return str.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }

  static slugify(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  static random(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomNumeric(length: number = 6): string {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomAlpha(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomAlphaNumeric(length: number = 10): string {
    return this.random(length);
  }

  static generateReference(prefix: string = 'REF'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = this.random(6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const random = this.randomNumeric(4);
    return `ORD${timestamp}${random}`;
  }

  static generateInvoiceId(): string {
    const timestamp = Date.now().toString();
    const random = this.randomNumeric(4);
    return `INV${timestamp}${random}`;
  }

  static generateCertificateId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = this.randomAlphaNumeric(8).toUpperCase();
    return `CERT${timestamp}${random}`;
  }

  static maskEmail(email: string): string {
    if (!email) return email;
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  static maskPhone(phone: string): string {
    if (!phone) return phone;
    if (phone.length <= 4) return phone;
    const visible = phone.slice(0, 4);
    const masked = '*'.repeat(phone.length - 4);
    return visible + masked;
  }

  static maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return cardNumber;
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length <= 4) return cardNumber;
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return masked + lastFour;
  }

  static extractInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return '';
    if (!firstName) return lastName.charAt(0).toUpperCase();
    if (!lastName) return firstName.charAt(0).toUpperCase();
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  static formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${this.formatNumber(value, decimals)}%`;
  }

  static pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${plural || singular + 's'}`;
  }

  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  static truncateWords(str: string, wordCount: number, suffix: string = '...'): string {
    if (!str) return str;
    const words = str.split(' ');
    if (words.length <= wordCount) return str;
    return words.slice(0, wordCount).join(' ') + suffix;
  }

  static stripHtml(html: string): string {
    if (!html) return html;
    return html.replace(/<[^>]*>/g, '');
  }

  static stripTags(str: string, allowedTags: string[] = []): string {
    if (!str) return str;
    const tags = allowedTags.join('|');
    return str.replace(new RegExp(`<(?!\/?(?:${tags})\b)[^>]+>`, 'gi'), '');
  }

  static escapeRegex(str: string): string {
    if (!str) return str;
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static highlight(str: string, query: string, className: string = 'highlight'): string {
    if (!str || !query) return str;
    const escapedQuery = this.escapeRegex(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return str.replace(regex, `<span class="${className}">$1</span>`);
  }

  static countWords(str: string): number {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
  }

  static countCharacters(str: string, includeSpaces: boolean = true): number {
    if (!str) return 0;
    return includeSpaces ? str.length : str.replace(/\s/g, '').length;
  }

  static isPalindrome(str: string): boolean {
    if (!str) return false;
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }

  static reverse(str: string): string {
    if (!str) return str;
    return str.split('').reverse().join('');
  }

  static shuffle(str: string): string {
    if (!str) return str;
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  static removeAccents(str: string): string {
    if (!str) return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static similarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
