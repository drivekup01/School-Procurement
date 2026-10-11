# Firestore rules additions for new School Procurement Word app

The new online editor uses the **existing** Firebase project `school-budget-3e69d` and existing `procurement_users/{uid}` profiles.

**IMPORTANT:** Do not replace the complete live Firestore rules with this file. Add the two `match` blocks **inside** the existing `match /databases/{database}/documents` section, keeping all School-Budget and existing Procurement rules.

```javascript
match /procurement_word_mappings_v1/{departmentId} {
  allow read: if request.auth != null
    && exists(/databases/$(database)/documents/procurement_users/$(request.auth.uid));
  allow create, update: if request.auth != null
    && exists(/databases/$(database)/documents/procurement_users/$(request.auth.uid))
    && get(/databases/$(database)/documents/procurement_users/$(request.auth.uid)).data.role == 'admin'
    && request.resource.data.keys().hasOnly(['sourceName','bindings','overrides','updatedBy','updatedAt'])
    && request.resource.data.updatedBy == request.auth.uid
    && request.resource.data.updatedAt == request.time;
  allow delete: if false;
}
match /procurement_word_drafts_v1/{draftId} {
  allow read, create, update: if request.auth != null
    && draftId.matches(request.auth.uid + '_.*')
    && exists(/databases/$(database)/documents/procurement_users/$(request.auth.uid))
    && (resource == null || resource.data.updatedBy == request.auth.uid)
    && (request.method == 'get' || request.resource.data.keys().hasOnly(['sourceName','departmentId','values','bindings','overrides','updatedBy','updatedAt']))
    && (request.method == 'get' || (request.resource.data.updatedBy == request.auth.uid && request.resource.data.updatedAt == request.time));
  allow delete: if false;
}
```

Firebase Storage already has a rule for `procurement/templates/departments/{department}/source.docx`. Confirm that the **published** rules contain it. The repository's `storage.rules` is not automatically deployed by GitHub Pages.

Online URL: https://drivekup01.github.io/School-Procurement/

Current limits: Mapping works on placeholder-containing paragraphs; user selects the field for each placeholder paragraph. This is not yet a full visual click-on-page mapper or a complete automatic 17-page procurement-document generator. PDF preview is rendered in the browser and may differ from Microsoft Word.
