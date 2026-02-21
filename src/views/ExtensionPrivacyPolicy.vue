<template>
  <div class="privacy-page">
    <div class="privacy-container">
      <header class="privacy-header">
        <h1>Privacy Policy</h1>
        <p class="subtitle">JepsonMath → Aeries Grade Transfer Chrome Extension</p>
        <p class="effective-date">Effective Date: February 2026</p>
      </header>

      <section>
        <h2>Overview</h2>
        <p>
          The JepsonMath → Aeries Grade Transfer extension ("the Extension") is a browser tool
          that helps teachers transfer standards-based math grades from the JepsonMath web
          application into the Aeries Student Information System (SIS) gradebook. This privacy
          policy explains what data the Extension handles and how it is used.
        </p>
      </section>

      <section>
        <h2>Data Collection</h2>
        <p>
          <strong>The Extension does not collect, transmit, or store any personal data on
          external servers.</strong> All data processing occurs entirely within the teacher's
          browser.
        </p>
        <p>The only data handled by the Extension is:</p>
        <ul>
          <li>
            <strong>Grade data</strong> that the teacher explicitly copies from the JepsonMath
            Gradebook using the "Copy Standards for Aeries" button. This data includes student
            IDs, student names, standard codes, and numeric scores.
          </li>
        </ul>
        <p>
          This grade data is temporarily stored in the browser's local storage
          (<code>chrome.storage.local</code>) so it persists while the teacher navigates between
          pages. It is never sent to any external server, third-party service, or analytics
          platform.
        </p>
      </section>

      <section>
        <h2>Permissions</h2>
        <p>The Extension requests the following browser permissions:</p>
        <ul>
          <li>
            <strong>activeTab</strong> — To interact with the currently open Aeries gradebook
            page when the teacher clicks "Paste Grades."
          </li>
          <li>
            <strong>storage</strong> — To temporarily store copied grade data in the browser
            so it persists between popup opens.
          </li>
          <li>
            <strong>clipboardRead</strong> — To read grade data that the teacher copied from
            the JepsonMath Gradebook. Only read when the teacher explicitly triggers it.
          </li>
          <li>
            <strong>Host access (*.aeries.net)</strong> — To inject a content script on
            Aeries gradebook pages that locates student rows and fills in score fields.
          </li>
        </ul>
      </section>

      <section>
        <h2>Data Sharing</h2>
        <p>The Extension does <strong>not</strong>:</p>
        <ul>
          <li>Sell or transfer user data to third parties</li>
          <li>Use data for advertising, analytics, or profiling</li>
          <li>Transmit any data to external servers</li>
          <li>Use or transfer data for creditworthiness or lending purposes</li>
          <li>Track browsing history or user activity</li>
        </ul>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          Grade data stored in <code>chrome.storage.local</code> remains until it is
          overwritten by a new export or the extension is uninstalled. Teachers can clear
          this data at any time by removing the extension from Chrome.
        </p>
      </section>

      <section>
        <h2>Remote Code</h2>
        <p>
          The Extension does not use any remote code. All JavaScript is bundled within the
          extension package. No external scripts, modules, or evaluated strings are loaded
          at runtime.
        </p>
      </section>

      <section>
        <h2>Children's Privacy</h2>
        <p>
          The Extension is intended for use by teachers and school administrators only. It
          does not directly interact with students or collect data from minors.
        </p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          If this privacy policy is updated, the revised version will be posted at this URL.
          Continued use of the Extension after changes constitutes acceptance of the updated
          policy.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about this privacy policy or the Extension, please contact
          the developer through the JepsonMath application.
        </p>
      </section>

      <footer class="privacy-footer">
        <p>&copy; {{ currentYear }} JepsonMath. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.privacy-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
}

.privacy-container {
  max-width: 760px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 48px;
}

.privacy-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.privacy-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 16px;
  color: #7c3aed;
  font-weight: 600;
  margin: 0 0 8px;
}

.effective-date {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

section {
  margin-bottom: 28px;
}

h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

p {
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
  margin: 0 0 12px;
}

ul {
  padding-left: 24px;
  margin: 0 0 12px;
}

li {
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
  margin-bottom: 6px;
}

code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #7c3aed;
}

.privacy-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
  text-align: center;
}

.privacy-footer p {
  font-size: 13px;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .privacy-container {
    padding: 24px;
  }

  .privacy-header h1 {
    font-size: 22px;
  }
}
</style>
