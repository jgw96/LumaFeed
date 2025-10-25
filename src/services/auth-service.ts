/**
 * WebAuthn-based local authentication service
 * Provides passkey registration and authentication without server dependency
 */

const AUTH_STORAGE_KEY = 'feeding-tracker-auth-credential';
const AUTH_USER_STORAGE_KEY = 'feeding-tracker-auth-user';

interface StoredCredential {
  credentialId: string;
  publicKey: string;
  email: string;
  displayName: string;
  createdAt: number;
}

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export const isWebAuthnSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
};

/**
 * Generate a cryptographically secure random challenge
 */
const generateChallenge = (): ArrayBuffer => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer;
};

/**
 * Convert string to ArrayBuffer for WebAuthn
 */
const stringToBuffer = (str: string): ArrayBuffer => {
  return new TextEncoder().encode(str).buffer;
};

/**
 * Convert Uint8Array to base64 string for storage
 */
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * Convert base64 string to ArrayBuffer
 */
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

class AuthService {
  /**
   * Check if a credential is registered
   */
  hasCredential(): boolean {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return !!stored;
    } catch {
      return false;
    }
  }

  /**
   * Get stored user information
   */
  getStoredUser(): StoredUser | null {
    try {
      const stored = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as StoredUser;
    } catch {
      return null;
    }
  }

  /**
   * Get stored credential information
   */
  private getStoredCredential(): StoredCredential | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as StoredCredential;
    } catch {
      return null;
    }
  }

  /**
   * Register a new WebAuthn credential
   */
  async register(email: string, displayName: string): Promise<void> {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = generateChallenge();
    const userId = crypto.randomUUID();
    const userIdBytes = stringToBuffer(userId);

    // Get current origin for RP ID
    const rpId = window.location.hostname;
    const rpName = 'LumaFeed';

    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: rpName,
            id: rpId,
          },
          user: {
            id: userIdBytes,
            name: email,
            displayName,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required',
          },
          attestation: 'none',
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Credential creation failed');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Store credential info
      const storedCredential: StoredCredential = {
        credentialId: bufferToBase64(credential.rawId),
        publicKey: bufferToBase64(response.getPublicKey() ?? new ArrayBuffer(0)),
        email,
        displayName,
        createdAt: Date.now(),
      };

      const storedUser: StoredUser = {
        id: userId,
        email,
        displayName,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedCredential));
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(storedUser));
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to register authentication credential'
      );
    }
  }

  /**
   * Authenticate using WebAuthn
   */
  async authenticate(): Promise<boolean> {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const storedCredential = this.getStoredCredential();
    if (!storedCredential) {
      throw new Error('No credential registered');
    }

    const challenge = generateChallenge();
    const credentialId = base64ToBuffer(storedCredential.credentialId);
    const rpId = window.location.hostname;

    try {
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId,
          allowCredentials: [
            {
              type: 'public-key',
              id: credentialId,
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      // In a real app, you'd verify the signature on the server
      // For local-only auth, we just check that the credential was presented
      // Mark session as authenticated
      this.setSessionAuthenticated(true);
      return true;
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  /**
   * Remove stored credentials
   */
  removeCredential(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove credential:', error);
    }
  }

  /**
   * Check if user is currently authenticated in this session
   */
  private sessionAuthKey = 'feeding-tracker-session-auth';

  isSessionAuthenticated(): boolean {
    try {
      const sessionAuth = sessionStorage.getItem(this.sessionAuthKey);
      return sessionAuth === 'true';
    } catch {
      return false;
    }
  }

  setSessionAuthenticated(authenticated: boolean): void {
    try {
      if (authenticated) {
        sessionStorage.setItem(this.sessionAuthKey, 'true');
      } else {
        sessionStorage.removeItem(this.sessionAuthKey);
      }
    } catch (error) {
      console.error('Failed to set session auth:', error);
    }
  }

  clearSession(): void {
    this.setSessionAuthenticated(false);
  }
}

export const authService = new AuthService();
