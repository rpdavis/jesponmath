# Google Sheets Assessment Import Template

## 📊 Template Structure

### **Required Columns (DO NOT CHANGE THESE HEADERS):**
- **Student Name** - Full name (e.g., "John Doe")
- **Student Email** - School email (e.g., "s-123456@vacavilleusd.org")
- **Grade** - Grade level (e.g., "7")
- **Period** - Class period (e.g., "4th Period", "5th Period", "6th Period")
- **Assessment** - Assessment name (MUST be: "ESA C1", "ESA C2", "ESA C3", or "ESA C4")
- **Q1, Q2, Q3, Q4, Q5, Q6** - Individual question scores (0, 0.5, 1, 2, etc.)

### **Data Entry Rules:**

#### **Student Information (Same for all rows):**
- **Student Name**: Use format "FirstName LastName"
- **Student Email**: Use exact email from student database
- **Grade**: Always "7" for Math 7
- **Period**: Use "4th Period", "5th Period", or "6th Period"

#### **Assessment Rows:**
- **Each student needs 1-4 rows** (one for each assessment they took)
- **Assessment**: MUST use exact names: "ESA C1", "ESA C2", "ESA C3", "ESA C4"
- **Question Scores**: Enter 0, 0.5, 1, 2, etc. (can use decimals)

#### **Missing Assessments:**
- **If a student didn't take an assessment, DON'T include that row**
- **Only include rows for assessments the student actually completed**

## 📝 Example Data Entry:

```
Student Name,Student Email,Grade,Period,Assessment,Q1,Q2,Q3,Q4,Q5,Q6
John Doe,s-123456@vacavilleusd.org,7,4th Period,ESA C1,0,1,1,0,1,0
John Doe,s-123456@vacavilleusd.org,7,4th Period,ESA C3,1,0,1,1,0,1
Jane Smith,s-789012@vacavilleusd.org,7,4th Period,ESA C1,1,1,0,1,1,1
Jane Smith,s-789012@vacavilleusd.org,7,4th Period,ESA C2,0,1,1,0,1,0
Jane Smith,s-789012@vacavilleusd.org,7,4th Period,ESA C4,0,0,1,0,0,1
```

## 🔄 Import Process:

### **Step 1: Create Google Sheet**
1. Open Google Sheets
2. Copy the template headers: `Student Name,Student Email,Grade,Period,Assessment,Q1,Q2,Q3,Q4,Q5,Q6`
3. Paste as the first row
4. Enter your student data following the format above

### **Step 2: Export from Google Sheets**
1. **File** → **Download** → **Comma Separated Values (.csv)**
2. Save the file (e.g., `period4_assessments.csv`)

### **Step 3: Import to JepsonMath**
1. Log in as **admin** to JepsonMath app
2. Go to **📊 CSV Import** from admin dashboard
3. **🧹 Click "Delete All CSV Results"** (if cleaning old data)
4. **📁 Upload your CSV file**
5. **🔄 Click "Import CSV"**
6. **✅ Check gradebook** to verify import

## ⚠️ Important Notes:

### **Assessment Names MUST Match Exactly:**
- ✅ "ESA C1" (correct)
- ❌ "ESA 1" (wrong)
- ❌ "esa c1" (wrong - case sensitive)

### **Student Emails Must Match Database:**
- Use the exact email from the student management system
- Check student list in app if unsure

### **Question Scores:**
- **0** = Incorrect/No answer
- **1** = Correct (full point)
- **0.5** = Partial credit (half point)
- **2** = Extra credit (if applicable)

### **Missing Data:**
- **Don't include rows for assessments student didn't take**
- **App will show "-" for missing assessments automatically**

## 📋 Period-Specific Templates:

You can create separate sheets for each period:
- **Period 4 Template**: Change "Period" column to "4th Period"
- **Period 5 Template**: Change "Period" column to "5th Period"  
- **Period 6 Template**: Change "Period" column to "6th Period"

## 🎯 Quick Start:

1. **Copy the template** from `GoogleSheets_Assessment_Import_Template.csv`
2. **Replace sample data** with your actual student data
3. **Export as CSV** from Google Sheets
4. **Import to JepsonMath** using the CSV Import tool

The app will automatically:
- ✅ Match students by email
- ✅ Link to existing assessments (ESA C1-C4)
- ✅ Use real question IDs with standards
- ✅ Calculate totals and percentages
- ✅ Display in gradebook with standards-based views
