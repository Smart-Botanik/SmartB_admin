/**
 * CORS Debugging Utilities
 * Helps identify and debug CORS-related issues
 */

export class CorsDebugger {
  /**
   * Test API connectivity and CORS configuration
   */
  static async testCorsConfiguration(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/health`;

      // Test with fetch to see CORS headers
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors", // Explicitly request CORS
        credentials: "omit", // Don't send credentials for test
      });

      const corsHeaders = {
        "access-control-allow-origin": response.headers.get(
          "access-control-allow-origin",
        ),
        "access-control-allow-methods": response.headers.get(
          "access-control-allow-methods",
        ),
        "access-control-allow-headers": response.headers.get(
          "access-control-allow-headers",
        ),
        "access-control-allow-credentials": response.headers.get(
          "access-control-allow-credentials",
        ),
      };

      return {
        success: response.ok,
        message: response.ok ? "CORS test successful" : "CORS test failed",
        details: {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          corsHeaders,
          allHeaders: Object.fromEntries(response.headers.entries()),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `CORS test failed: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack,
          isCorsError:
            error.message.includes("CORS") ||
            error.message.includes("cross-origin"),
        },
      };
    }
  }

  /**
   * Log current environment configuration
   */
  static logEnvironmentConfig(): void {
    console.group("🔍 CORS Debug - Environment Configuration");
    console.log(
      "API URL:",
      import.meta.env.VITE_API_URL || "http://localhost:3001",
    );
    console.log("Current Origin:", window.location.origin);
    console.log("Current Host:", window.location.host);
    console.log("Current Protocol:", window.location.protocol);
    console.log("Development Mode:", import.meta.env.DEV);
    console.log("Environment:", import.meta.env.MODE);
    console.groupEnd();
  }

  /**
   * Test authentication endpoint specifically
   */
  static async testAuthEndpoint(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/health`;

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
      });

      return {
        success: response.ok,
        message: response.ok
          ? "Health endpoint accessible"
          : "Health endpoint failed",
        details: {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Health endpoint test failed: ${error.message}`,
        details: {
          error: error.message,
          isCorsError:
            error.message.includes("CORS") ||
            error.message.includes("cross-origin"),
        },
      };
    }
  }

  /**
   * Run comprehensive CORS diagnostics
   */
  static async runDiagnostics(): Promise<void> {
    console.group("🔍 CORS Diagnostics Starting...");

    // Log environment
    this.logEnvironmentConfig();

    // Test basic connectivity
    console.log("Testing basic API connectivity...");
    const basicTest = await this.testCorsConfiguration();
    console.log("Basic API Test:", basicTest);

    // Test health endpoint
    console.log("Testing health endpoint...");
    const authTest = await this.testAuthEndpoint();
    console.log("Health Endpoint Test:", authTest);

    // Provide recommendations
    console.group("📋 Recommendations");
    if (!basicTest.success) {
      console.warn("❌ Basic API connectivity failed:");
      console.warn(
        "   1. Ensure backend server is running on",
        import.meta.env.VITE_API_URL || "http://localhost:3001",
      );
      console.warn("   2. Check if backend has CORS middleware configured");
      console.warn("   3. Verify Vite proxy configuration in vite.config.ts");
    }

    if (!authTest.success) {
      console.warn("❌ Health endpoint failed:");
      console.warn("   1. Check if /api/health route exists in backend");
      console.warn("   2. Verify backend server is running and accessible");
    }

    if (basicTest.success && authTest.success) {
      console.log("✅ All CORS tests passed!");
    }
    console.groupEnd();

    console.groupEnd();
  }
}

/**
 * Auto-run CORS diagnostics in development mode
 */
if (import.meta.env.DEV) {
  // Run diagnostics after a short delay to ensure app is loaded
  setTimeout(() => {
    CorsDebugger.runDiagnostics();
  }, 2000);
}

export default CorsDebugger;
