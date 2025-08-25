import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { generateAccessToken, generateRefreshToken, type User } from './auth';

// OAuth configuration
export const OAUTH_CONFIG = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${process.env.OAUTH_CALLBACK_URL}/google`,
    scope: ['profile', 'email']
  },
  facebook: {
    appID: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: `${process.env.OAUTH_CALLBACK_URL}/facebook`,
    profileFields: ['id', 'displayName', 'photos', 'email']
  }
};

// JWT configuration for OAuth
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';

// OAuth profile interface
export interface OAuthProfile {
  provider: 'google' | 'facebook';
  providerUserId: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  profileData: any;
}

// Initialize Passport strategies
export function initializePassport() {
  // JWT Strategy for OAuth tokens
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
  }, async (payload, done) => {
    try {
      // The payload is already verified by the JWT middleware
      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google OAuth Strategy (only if configured)
  if (OAUTH_CONFIG.google.clientID && OAUTH_CONFIG.google.clientSecret &&
    OAUTH_CONFIG.google.clientID !== '' && OAUTH_CONFIG.google.clientSecret !== '' &&
    OAUTH_CONFIG.google.clientID !== 'your-google-client-id' && OAUTH_CONFIG.google.clientSecret !== 'your-google-client-secret') {
    passport.use(new GoogleStrategy(OAUTH_CONFIG.google, async (accessToken, refreshToken, profile, done) => {
      try {
        const oauthProfile: OAuthProfile = {
          provider: 'google',
          providerUserId: profile.id,
          email: profile.emails?.[0]?.value || '',
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          picture: profile.photos?.[0]?.value,
          profileData: profile._json
        };

        return done(null, oauthProfile);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  // Facebook OAuth Strategy (only if configured)
  if (OAUTH_CONFIG.facebook.appID && OAUTH_CONFIG.facebook.appSecret &&
    OAUTH_CONFIG.facebook.appID !== '' && OAUTH_CONFIG.facebook.appSecret !== '' &&
    OAUTH_CONFIG.facebook.appID !== 'your-facebook-app-id' && OAUTH_CONFIG.facebook.appSecret !== 'your-facebook-app-secret') {
    const facebookConfig = {
      clientID: OAUTH_CONFIG.facebook.appID,
      clientSecret: OAUTH_CONFIG.facebook.appSecret,
      callbackURL: OAUTH_CONFIG.facebook.callbackURL,
      profileFields: OAUTH_CONFIG.facebook.profileFields
    };
    passport.use(new FacebookStrategy(facebookConfig, async (accessToken, refreshToken, profile, done) => {
      try {
        const oauthProfile: OAuthProfile = {
          provider: 'facebook',
          providerUserId: profile.id,
          email: profile.emails?.[0]?.value || '',
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          picture: profile.photos?.[0]?.value,
          profileData: profile._json
        };

        return done(null, oauthProfile);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  // Serialize user for session (not used with JWT, but required by Passport)
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

// OAuth utility functions
export function generateOAuthTokens(user: User) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}

// Validate OAuth configuration
export function validateOAuthConfig() {
  const errors: string[] = [];

  if (!OAUTH_CONFIG.google.clientID || !OAUTH_CONFIG.google.clientSecret) {
    errors.push('Google OAuth credentials not configured');
  }

  if (!OAUTH_CONFIG.facebook.appID || !OAUTH_CONFIG.facebook.appSecret) {
    errors.push('Facebook OAuth credentials not configured');
  }

  if (!process.env.OAUTH_CALLBACK_URL) {
    errors.push('OAuth callback URL not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// OAuth provider validation
export function isValidOAuthProvider(provider: string): provider is 'google' | 'facebook' {
  return ['google', 'facebook'].includes(provider);
}

// OAuth callback URL generation
export function getOAuthCallbackUrl(provider: 'google' | 'facebook'): string {
  const baseUrl = process.env.OAUTH_CALLBACK_URL || 'http://localhost:8080/api/auth/oauth/callback';
  return `${baseUrl}/${provider}`;
}

// OAuth authorization URL generation
export function getOAuthAuthUrl(provider: 'google' | 'facebook'): string {
  const baseUrl = process.env.OAUTH_CALLBACK_URL || 'http://localhost:8080/api/auth/oauth/callback';
  return `${baseUrl}/${provider}`;
}

export default {
  initializePassport,
  generateOAuthTokens,
  validateOAuthConfig,
  isValidOAuthProvider,
  getOAuthCallbackUrl,
  getOAuthAuthUrl,
  OAUTH_CONFIG
};
