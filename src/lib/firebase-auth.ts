import admin from 'firebase-admin';
import axios from 'axios';
import { config } from '../config';
import { firebaseService } from '../services/firebase';

/**
 * Firebase Authentication Service
 * Provides server-side authentication operations using Firebase Admin SDK
 */
export class FirebaseAuthService {
  private getAuth() {
    // Initialize Firebase if not already initialized
    firebaseService.initialize();
    return admin.auth();
  }

  /**
   * Create a new user with email and password
   * @param email User's email address
   * @param password User's password
   * @param displayName User's display name
   * @returns UserRecord from Firebase
   */
  async createUser(email: string, password: string, displayName: string) {
    try {
      const userRecord = await this.getAuth().createUser({
        email,
        password,
        displayName,
        emailVerified: true, // Skip email verification for now
      });

      return userRecord;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create user');
    }
  }

  /**
   * Verify a Firebase ID token
   * @param idToken The Firebase ID token to verify
   * @param checkRevoked Whether to check if the token has been revoked
   * @returns Decoded token with user claims
   */
  async verifyIdToken(idToken: string, checkRevoked: boolean = false) {
    try {
      const decodedToken = await this.getAuth().verifyIdToken(idToken, checkRevoked);
      return decodedToken;
    } catch (error: any) {
      throw new Error(error.message || 'Invalid or expired token');
    }
  }

  /**
   * Verify user password using Firebase REST API
   * This is needed because Firebase Admin SDK cannot verify passwords directly
   * @param email User's email
   * @param password User's password
   * @returns Authentication response with ID token
   */
  async verifyPassword(email: string, password: string) {
    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.firebase.webApiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      return {
        idToken: response.data.idToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
        localId: response.data.localId, // Firebase UID
        email: response.data.email,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Invalid email or password';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a user's password
   * @param uid Firebase UID
   * @param newPassword New password
   * @returns Updated UserRecord
   */
  async updateUserPassword(uid: string, newPassword: string) {
    try {
      const userRecord = await this.getAuth().updateUser(uid, {
        password: newPassword,
      });

      return userRecord;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  }

  /**
   * Get a user by email address
   * @param email User's email
   * @returns UserRecord
   */
  async getUserByEmail(email: string) {
    try {
      const userRecord = await this.getAuth().getUserByEmail(email);
      return userRecord;
    } catch (error: any) {
      throw new Error(error.message || 'User not found');
    }
  }

  /**
   * Get a user by Firebase UID
   * @param uid Firebase UID
   * @returns UserRecord
   */
  async getUserByUid(uid: string) {
    try {
      const userRecord = await this.getAuth().getUser(uid);
      return userRecord;
    } catch (error: any) {
      throw new Error(error.message || 'User not found');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * This will sign out the user from all devices
   * @param uid Firebase UID
   */
  async revokeRefreshTokens(uid: string) {
    try {
      await this.getAuth().revokeRefreshTokens(uid);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to revoke tokens');
    }
  }

  /**
   * Delete a user from Firebase Auth
   * @param uid Firebase UID
   */
  async deleteUser(uid: string) {
    try {
      await this.getAuth().deleteUser(uid);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  /**
   * Create a custom token for a user
   * Useful for server-side authentication flows
   * @param uid Firebase UID
   * @param additionalClaims Optional additional claims to include in the token
   * @returns Custom token string
   */
  async createCustomToken(uid: string, additionalClaims?: object) {
    try {
      const customToken = await this.getAuth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create custom token');
    }
  }

  /**
   * Update user email
   * @param uid Firebase UID
   * @param newEmail New email address
   * @returns Updated UserRecord
   */
  async updateUserEmail(uid: string, newEmail: string) {
    try {
      const userRecord = await this.getAuth().updateUser(uid, {
        email: newEmail,
        emailVerified: false, // Require re-verification of new email
      });

      return userRecord;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update email');
    }
  }

  /**
   * Set custom user claims
   * Useful for role-based access control
   * @param uid Firebase UID
   * @param customClaims Object with custom claims
   */
  async setCustomUserClaims(uid: string, customClaims: object) {
    try {
      await this.getAuth().setCustomUserClaims(uid, customClaims);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to set custom claims');
    }
  }
}

// Export singleton instance
export const firebaseAuth = new FirebaseAuthService();
