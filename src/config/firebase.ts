// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import type {
  Auth,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';
import { environment } from './environment';

// Initialize Firebase
const app: FirebaseApp = initializeApp(environment.firebase);
const auth: Auth = getAuth(app);

// Set to use local emulator in development if needed
// Uncomment the line below if running Firebase emulator locally
// if (environment.envType === 'dev') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult, ApplicationVerifier };
