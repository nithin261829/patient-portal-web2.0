// Firebase Authentication Service for OTP flow
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '@/config/firebase';
import type { ConfirmationResult, ApplicationVerifier } from '@/config/firebase';

class FirebaseAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Initialize reCAPTCHA verifier for phone auth
   * @param containerId - ID of the DOM element to render reCAPTCHA
   * @param size - 'invisible' or 'normal'
   */
  initializeRecaptcha(
    containerId: string,
    size: 'invisible' | 'normal' = 'invisible'
  ): void {
    // Check if already initialized
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    // Clear existing recaptcha if present
    if (container.hasChildNodes()) {
      container.innerHTML = '';
    }

    try {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size,
        callback: () => {
          // reCAPTCHA solved - callback handled by sendOtp
        },
        'expired-callback': () => {
          console.warn('[Firebase Auth] reCAPTCHA expired');
          this.resetRecaptcha();
        },
        'error-callback': (error: Error) => {
          console.error('[Firebase Auth] reCAPTCHA error:', error);
        },
      });

      this.recaptchaVerifier.render().catch((error) => {
        console.error('[Firebase Auth] Failed to render reCAPTCHA:', error);
      });
    } catch (error) {
      console.error('[Firebase Auth] Failed to initialize reCAPTCHA:', error);
      throw error;
    }
  }

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +15551234567)
   * @returns Promise that resolves when OTP is sent
   */
  async sendOtp(phoneNumber: string): Promise<void> {
    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier not initialized. Call initializeRecaptcha() first.');
    }

    try {
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        this.recaptchaVerifier as ApplicationVerifier
      );
      console.log('[Firebase Auth] OTP sent successfully');
    } catch (error: any) {
      console.error('[Firebase Auth] Failed to send OTP:', error);

      // Reset reCAPTCHA on certain errors
      if (error.code === 'auth/captcha-check-failed') {
        this.resetRecaptcha();
      }

      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Verify OTP code
   * @param otp - 6-digit OTP code
   * @returns Firebase ID token
   */
  async verifyOtp(otp: string): Promise<string> {
    if (!this.confirmationResult) {
      throw new Error('No pending OTP verification. Call sendOtp() first.');
    }

    try {
      const userCredential = await this.confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();
      console.log('[Firebase Auth] OTP verified successfully');
      return idToken;
    } catch (error: any) {
      console.error('[Firebase Auth] Failed to verify OTP:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Reset reCAPTCHA verifier
   */
  resetRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.warn('[Firebase Auth] Failed to clear reCAPTCHA:', error);
      }
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.resetRecaptcha();
    this.confirmationResult = null;
  }

  /**
   * Format phone number to E.164 format
   * @param phone - Phone number string
   * @returns Formatted phone number with country code
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add +1 for US numbers
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (!cleaned.startsWith('+')) {
      return `+1${cleaned}`;
    }

    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Handle Firebase errors and return user-friendly messages
   */
  private handleFirebaseError(error: any): Error {
    let message = 'An error occurred. Please try again.';

    switch (error.code) {
      case 'auth/too-many-requests':
        message = 'Too many requests. Please wait a few minutes and try again.';
        break;
      case 'auth/captcha-check-failed':
        message = 'reCAPTCHA verification failed. Please try again.';
        break;
      case 'auth/invalid-phone-number':
        message = 'Invalid phone number. Please check and try again.';
        break;
      case 'auth/invalid-verification-code':
        message = 'Invalid verification code. Please check and try again.';
        break;
      case 'auth/code-expired':
        message = 'Verification code expired. Please request a new code.';
        break;
      case 'auth/invalid-app-credential':
        message = 'Firebase configuration error. Please contact support.';
        break;
      case 'auth/unauthorized-domain':
        message = 'This domain is not authorized. Please contact support.';
        break;
      case 'auth/quota-exceeded':
        message = 'SMS quota exceeded. Please try again later or contact support.';
        break;
      case 'auth/missing-phone-number':
        message = 'Phone number is required.';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
