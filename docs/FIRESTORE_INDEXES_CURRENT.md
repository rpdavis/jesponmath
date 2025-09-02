# Current Firestore Indexes

This document contains the current Firestore composite indexes for the JepsonMath Assessment System.

## Current Indexes Configuration

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastName",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "grade",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastName",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "userType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentSeisId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "goals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "gradeLevel",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "assessmentResults",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentSeisId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "assessmentResults",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "goalId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "completedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "assignedTeacher",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastName",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdBy",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Index Purposes

### **Users Collection Indexes:**
1. **userType + isActive + lastName** - For filtering active users by type and sorting by name
2. **userType + grade + lastName** - For filtering users by grade level
3. **teacherId + userType + isActive** - For finding active students assigned to specific teachers

### **Goals Collection Indexes:**
1. **studentSeisId + isActive + category** - For finding active goals by student and category
2. **category + gradeLevel + isActive** - For filtering goals by category and grade level

### **Assessment Results Indexes:**
1. **studentSeisId + completedAt** - For finding student results ordered by completion date
2. **goalId + completedAt** - For finding results for specific goals ordered by date

### **Students Collection Indexes:**
1. **assignedTeacher + isActive + lastName** - For teachers to find their assigned students

### **Assessments Collection Indexes:**
1. **createdBy + createdAt** - For teachers to find their created assessments ordered by date

## Missing Index (Causing Current Error)

The gradebook is trying to query `assessmentResults` by `assessmentId` and `completedAt`, which requires this additional index:

```json
{
  "collectionGroup": "assessmentResults",
  "queryScope": "COLLECTION", 
  "fields": [
    {
      "fieldPath": "assessmentId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "completedAt",
      "order": "DESCENDING"
    }
  ]
}
```

## Index Management

### **To Add Missing Index:**
1. Click the provided Firebase Console link in the error message
2. Or manually add to `firestore.indexes.json`
3. Deploy with `firebase deploy --only firestore:indexes`

### **Index Creation Time:**
- Simple indexes: Usually instant
- Composite indexes: Can take several minutes for large datasets
- Check status in Firebase Console → Firestore → Indexes

## Last Updated
January 2025 - JepsonMath Assessment System v1.0
