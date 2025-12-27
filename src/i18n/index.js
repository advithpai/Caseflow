// Simple i18n implementation ready for expansion
// Can be replaced with libraries like i18next or react-intl

const translations = {
  en: {
    // Authentication
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.logout": "Logout",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "auth.role": "Role",
    "auth.operator": "Operator",
    "auth.admin": "Admin",
    
    // Navigation
    "nav.home": "Home",
    "nav.upload": "Upload",
    "nav.cases": "Cases",
    "nav.settings": "Settings",
    
    // Upload
    "upload.title": "Upload CSV",
    "upload.description": "Upload a CSV file to begin the validation process",
    "upload.dropzone": "Drop your CSV file here",
    "upload.browse": "or click to browse",
    "upload.maxRows": "Supports CSV files up to 50k rows",
    
    // Mapping
    "mapping.title": "Map CSV Columns",
    "mapping.description": "Match your CSV columns to the required fields",
    "mapping.fieldsMapped": "Fields mapped",
    "mapping.autoDetected": "Auto-detected",
    "mapping.continue": "Continue to Validation",
    
    // Validation
    "validation.title": "Validate & Fix Data",
    "validation.description": "Review validation errors and fix issues before submission",
    "validation.totalRows": "Total Rows",
    "validation.valid": "Valid",
    "validation.errors": "Errors",
    "validation.allRows": "All Rows",
    "validation.errorsOnly": "Errors Only",
    "validation.validOnly": "Valid Only",
    
    // Bulk Actions
    "bulk.trimWhitespace": "Trim Whitespace",
    "bulk.titleCaseNames": "Title Case Names",
    "bulk.normalizePhones": "Normalize Phones",
    "bulk.uppercaseCategory": "Uppercase Category",
    "bulk.defaultPriority": "Default Priority",
    
    // Submit - Ready State
    "submit.title": "Submit Cases",
    "submit.description": "Final step: Submit your validated data",
    "submit.ready": "Ready to Submit",
    "submit.readyDescription": "You're about to submit {count} rows. This process will validate and submit data in batches.",
    "submit.readyRegion": "Submission ready",
    "submit.batchSize": "Batch Size",
    "submit.rowsPerBatch": "rows per batch",
    "submit.totalBatches": "Total Batches",
    "submit.navigation": "Submission navigation",
    "submit.startSubmission": "Start Submission",
    "submit.startDescription": "Click to submit {count} cases to the system",
    
    // Submit - Submitting State
    "submit.submitting": "Submitting Cases",
    "submit.submittingRegion": "Submission in progress",
    "submit.retrying": "Retrying Failed Cases",
    "submit.pleaseWait": "Please wait while we process your data...",
    "submit.progress": "Progress",
    "submit.progressLabel": "Submission progress: {progress}%",
    "submit.currentBatch": "Current Batch",
    "submit.remaining": "Rows Remaining",
    "submit.doNotClose": "Do not close this window. Your submission is being processed.",
    
    // Submit - Complete State
    "submit.complete": "Submission Complete",
    "submit.completeRegion": "Submission results",
    "submit.resultsSummary": "Results summary",
    "submit.totalRows": "Total Rows",
    "submit.totalRowsLabel": "Total rows submitted",
    "submit.successful": "Successful",
    "submit.successfulLabel": "Successfully submitted rows",
    "submit.failed": "Failed",
    "submit.failedLabel": "Failed rows",
    
    // Submit - Success Messages
    "submit.allCasesSuccessful": "All Cases Submitted Successfully!",
    "submit.allCasesProcessed": "All {count} cases have been processed and submitted.",
    "submit.allSuccessful": "Successfully submitted {count} cases!",
    "submit.partialSuccess": "Submitted {success} cases with {failed} failures",
    "submit.allFailed": "All cases failed to submit",
    
    // Submit - Failure Messages
    "submit.someCasesFailed": "Some Cases Failed",
    "submit.failedDescription": "{count} cases failed to submit. Review the errors below and retry.",
    "submit.errorList": "List of submission errors",
    "submit.row": "Row",
    "submit.moreErrors": "...and {count} more errors",
    "submit.chunkFailed": "Batch submission failed",
    
    // Submit - Actions
    "submit.retry": "Retry Failed Rows",
    "submit.retryFailed": "Retry Failed Rows",
    "submit.retryFailedAria": "Retry submitting failed rows",
    "submit.downloadErrors": "Download Error Report",
    "submit.downloadErrorsAria": "Download CSV file with error details",
    "submit.importReport": "Import Report",
    "submit.importReportDescription": "Download a detailed report of this import",
    "submit.downloadReport": "Download Report",
    "submit.downloadReportAria": "Download JSON import report",
    "submit.viewAllCases": "View All Cases",
    "submit.importMore": "Import More",
    "submit.errorReportDownloaded": "Error report downloaded",
    
    // Submit - Retry Messages
    "submit.noDataToRetry": "No data available to retry",
    "submit.retryAllSuccessful": "All failed cases submitted successfully!",
    "submit.retryPartialSuccess": "Retry completed: {success} succeeded, {failed} still failed",
    "submit.retryError": "Failed to retry submission: {message}",
    "submit.error": "Failed to submit cases: {message}",
    
    // Cases
    "cases.title": "Cases",
    "cases.description": "View and manage all your case submissions",
    "cases.uploadNew": "Upload New",
    "cases.search": "Search by filename...",
    "cases.allStatus": "All Status",
    "cases.allTime": "All Time",
    "cases.today": "Today",
    "cases.thisWeek": "This Week",
    "cases.thisMonth": "This Month",
    
    // Status
    "status.draft": "Draft",
    "status.validating": "Validating",
    "status.valid": "Valid",
    "status.submitted": "Submitted",
    "status.failed": "Failed",
    
    // Common
    "common.back": "Back",
    "common.continue": "Continue",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    
    // Validation Messages
    "validation.caseIdRequired": "Case ID is required",
    "validation.nameRequired": "Applicant name is required",
    "validation.dobInvalid": "Date of birth must be in YYYY-MM-DD format",
    "validation.emailInvalid": "Invalid email address",
    "validation.phoneInvalid": "Invalid phone number (E.164 format recommended)",
    "validation.categoryInvalid": "Category must be TAX, LICENSE, or PERMIT",
    "validation.priorityInvalid": "Priority must be LOW, MEDIUM, or HIGH",
    
    // Accessibility
    "a11y.skipToContent": "Skip to main content",
    "a11y.loading": "Loading, please wait",
    "a11y.error": "Error occurred",
    "a11y.success": "Operation successful",
    "a11y.required": "Required field",
    "a11y.optional": "Optional field",
    "a11y.sortAscending": "Sort ascending",
    "a11y.sortDescending": "Sort descending",
    "a11y.rowNumber": "Row number",
    "a11y.status": "Status",
    "a11y.valid": "Valid",
    "a11y.invalid": "Invalid",
    "a11y.editCell": "Click to edit this cell",
    "a11y.deleteRow": "Delete this row",
    "a11y.closeDialog": "Close dialog",
  },
  // Placeholder for Spanish translations
  es: {
    "auth.login": "Iniciar sesión",
    "auth.signup": "Registrarse",
    "auth.logout": "Cerrar sesión",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "common.back": "Volver",
    "common.continue": "Continuar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.loading": "Cargando...",
    "submit.ready": "Listo para enviar",
    "submit.submitting": "Enviando casos",
    "submit.complete": "Envío completado",
    "submit.successful": "Exitosos",
    "submit.failed": "Fallidos",
    // Add more Spanish translations as needed
  },
  // Placeholder for French translations
  fr: {
    "auth.login": "Connexion",
    "auth.signup": "S'inscrire",
    "auth.logout": "Déconnexion",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "common.back": "Retour",
    "common.continue": "Continuer",
    "common.cancel": "Annuler",
    "common.save": "Sauvegarder",
    "common.loading": "Chargement...",
    "submit.ready": "Prêt à soumettre",
    "submit.submitting": "Soumission en cours",
    "submit.complete": "Soumission terminée",
    "submit.successful": "Réussis",
    "submit.failed": "Échoués",
    // Add more French translations as needed
  },
}

let currentLocale = "en"

export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale
    // Store in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("locale", locale)
    }
  }
}

export function getLocale() {
  return currentLocale
}

/**
 * Translate a key with optional variable interpolation
 * ALWAYS returns a string - never an object
 * 
 * @param {string} key - Translation key
 * @param {object|string} varsOrFallback - Variables for interpolation OR fallback string
 * @returns {string} Translated string
 */
export function t(key, varsOrFallback) {
  // Handle both t(key) and t(key, vars) and t(key, fallback)
  let vars = {}
  let fallback = key
  
  if (typeof varsOrFallback === 'object' && varsOrFallback !== null) {
    vars = varsOrFallback
  } else if (typeof varsOrFallback === 'string') {
    fallback = varsOrFallback
  }
  
  // Get translation, falling back to English then to the key itself
  let translation = translations[currentLocale]?.[key] || translations.en?.[key] || fallback
  
  // Ensure translation is a string
  if (typeof translation !== 'string') {
    translation = String(fallback)
  }
  
  // Interpolate variables like {count}, {success}, {failed}, etc.
  if (vars && typeof vars === 'object') {
    Object.entries(vars).forEach(([varKey, value]) => {
      const regex = new RegExp(`\\{${varKey}\\}`, 'g')
      translation = translation.replace(regex, String(value ?? ''))
    })
  }
  
  // Final safety check - always return a string
  return String(translation)
}

// Initialize from localStorage
if (typeof localStorage !== 'undefined') {
  try {
    const savedLocale = localStorage.getItem("locale")
    if (savedLocale && translations[savedLocale]) {
      currentLocale = savedLocale
    }
  } catch (e) {
    // Ignore localStorage errors (e.g., in SSR)
  }
}

export default {
  t,
  setLocale,
  getLocale,
  translations,
}
