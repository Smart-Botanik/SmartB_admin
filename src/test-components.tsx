import { ConfigProvider } from "antd";
import { MediaUpload } from "./components/Media/MediaUpload/MediaUpload";
import { MediaGrid } from "./components/Media/MediaGrid/MediaGrid";

// Simple test to verify components render
const TestComponents = () => {
  return (
    <ConfigProvider>
      <div style={{ padding: 24 }}>
        <h1>Media Components Test</h1>

        <div style={{ marginBottom: 32 }}>
          <h2>MediaUpload Component</h2>
          <MediaUpload
            maxFiles={5}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            multiple={true}
            showProgress={true}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2>MediaGrid Component</h2>
          <MediaGrid selectable={true} showActions={true} pageSize={20} />
        </div>
      </div>
    </ConfigProvider>
  );
};

// Test if this file can be imported and rendered
if (typeof window !== "undefined") {
  console.log("Media components can be imported successfully");
}

export default TestComponents;
