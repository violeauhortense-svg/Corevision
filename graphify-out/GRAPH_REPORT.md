# Graph Report - Corevision-main  (2026-07-19)

## Corpus Check
- 287 files · ~286,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1249 nodes · 1559 edges · 40 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 193 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 85|Community 85]]

## God Nodes (most connected - your core abstractions)
1. `getByPrefix()` - 29 edges
2. `getSession()` - 18 edges
3. `analyserProfilClient()` - 14 edges
4. `EventEmitter` - 11 edges
5. `genererAuditComplet()` - 10 edges
6. `getSql()` - 9 edges
7. `CalculServiceClass` - 9 edges
8. `genererMontageDepuisRegles()` - 8 edges
9. `analyseAvancee7Etapes()` - 8 edges
10. `del()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `getByPrefix()` --calls--> `getSimulationsClient()`  [INFERRED]
  src\app\backend\kv_store.tsx → src\app\backend\simulateur_patrimonial.tsx
- `getByPrefix()` --calls--> `getSimulateurStats()`  [INFERRED]
  src\app\backend\kv_store.tsx → src\app\backend\simulateur_patrimonial.tsx
- `collecterDonneesClient()` --calls--> `getByPrefix()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\kv_store.tsx
- `rechercherStrategies()` --calls--> `getAllMontages()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\montages_core.tsx
- `getAuditsClient()` --calls--> `getByPrefix()`  [INFERRED]
  src\app\backend\audit_patrimonial.tsx → src\app\backend\kv_store.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (83): App(), getAudit(), getAuditsClient(), modifierAudit(), validerAudit(), initBaremes2026(), setupBaremesRoutes(), getCollecteStats() (+75 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (26): base64url(), base64urlDecode(), createUser(), hashPassword(), signInUser(), signJWT(), verifyAuth(), verifyAuthFromCookie() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (29): checkAuditProgress(), handleOrderValidated(), loadData(), detectIncoh(), handleSaveAudit(), handleSavePreconisations(), handleSavePresentation(), handleValidateAndSend() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (32): analyserCivil(), analyserFiscal(), analyserPatrimoine(), analyserSocial(), collecterDonneesClient(), genererAuditComplet(), genererRapportLive(), rechercherStrategies() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (19): getMeetingsForDate(), getTasksForDate(), getTodayItems(), handleCreateMeeting(), loadAgendaData(), toggleMeeting(), toggleTask(), completeTask() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (26): setupCoreVisionRoutes(), setupMontagesPatrimoniauxRoutes(), analyserProfilClient(), calculerNbParts(), calculerRevenusTotaux(), construireRequeteRegles(), determinerTrancheMarginalIR(), estimerEconomiesFiscales() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (15): genererRapport(), handleRunAudit(), handleCreateClient(), handleDeleteClient(), async(), handleTaskUpdate(), loadClient(), saveArbitrageFields() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (13): calculateValorisation(), getAnalyseSituation(), getBFR(), getComptesAssocies(), getCouvertureBFR(), getFinancementParAssocies(), getTotalActif(), getTotalPassif() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (13): handleReinitialiser(), handleSubmit(), handleSubmit(), confirmAction(), getGraviteBadge(), getStatutBadge(), handleSubmit(), handleSave() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.1
Nodes (7): handleDeleteOrder(), updateOrderStatus(), CalculServiceClass, getCacheKey(), getFromCache(), setCache(), CoreVisionServiceClass

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (11): detecterIncoherences(), extraireDonneesDetection(), setupIncoherencesRoutes(), extraireDonneesClient(), genererRecommandations(), setupRecommandationsRoutes(), calculateAge(), removeChild() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (10): handleInitialiserRegles(), handleInitialiserReglesRetraite(), handleInitialiserReglesSociales(), handleLaunchCollecte(), handleLaunchCollecteRetraite(), handleLaunchCollecteSocial(), loadReglesCollectees(), loadReglesRetraite() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (9): setupBilanRoutes(), sendDERSignatureEmail(), EmailServiceFactory, getEmailService(), StubEmailService, wrapEmailHtml(), sendCGPNotificationEmail(), sendSignatureEmail() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (2): EventEmitter, useTaskEvents()

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (3): handleSendRequest(), handleSendProposal(), recordEmailHistory()

### Community 15 - "Community 15"
Cohesion: 0.2
Nodes (14): setupCollecteurJuridiqueRoutes(), calculerCompatibilite(), estimerEconomie(), genererEtapesMontage(), genererMontageDepuisRegles(), genererMontagesAutomatiques(), genererNomMontage(), genererObjectif() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (8): isSCI(), handleOptimiser(), SimulationsProjections(), calculerIR(), calculerPlafondDividendesTNS(), calculerScenario(), formatEuro(), optimiserRemuneration()

### Community 17 - "Community 17"
Cohesion: 0.23
Nodes (11): creerMontage(), deleteMontage(), getAllMontages(), getAllTags(), getAllTemplates(), getMontage(), getMontagesStats(), importerMontages() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (3): addLog(), handleIndexDocument(), loadDocuments()

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (5): calculerMontantDevis(), genererDevis(), handleOpenDetail(), handleToggleObjectif(), isObjectifSelected()

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (3): loadMetrics(), loadKanban(), getAuthToken()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 25 - "Community 25"
Cohesion: 0.31
Nodes (6): handleAdminValidation(), handleDocumentsUpdate(), handleSwitchTab(), loadClientData(), reloadDocuments(), initializeRequiredDocuments()

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (2): handleEmailClick(), handleMarkAsRead()

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (6): handleDeleteDocument(), handleFileUpload(), loadDocuments(), deleteRequestedDocument(), getRequestedDocuments(), uploadRequestedDocument()

### Community 29 - "Community 29"
Cohesion: 0.42
Nodes (7): validateClientData(), validateDate(), validateEmail(), validateName(), validateNumericField(), validatePatrimoineItem(), validatePhone()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (2): calculerRevenuFoncier(), calculerValeursAutomatiques()

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (2): chargerParametresDefaut(), handleMontageChange()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (2): isValidTaskState(), validateTaskUpdate()

### Community 35 - "Community 35"
Cohesion: 0.52
Nodes (6): chargerOuCreerDossier(), genererSection(), initialiserPrompts(), modifierContenuSection(), sauvegarderDossier(), validerDossier()

### Community 41 - "Community 41"
Cohesion: 0.48
Nodes (5): calculerIFI(), calculerImpotRevenu(), calculerPrelevementsSociaux(), getDefaultBaremes(), loadBaremes()

### Community 42 - "Community 42"
Cohesion: 0.62
Nodes (6): generateDetentionSummary(), getDetentionContext(), isAcquisitionAvantMariage(), isRegimeCommunautaire(), isRegimeSeparatiste(), validateDetention()

### Community 43 - "Community 43"
Cohesion: 0.47
Nodes (3): resetToDefault(), saveEdit(), saveRegles()

### Community 47 - "Community 47"
Cohesion: 0.53
Nodes (4): FormControl(), FormDescription(), FormMessage(), useFormField()

### Community 51 - "Community 51"
Cohesion: 0.6
Nodes (3): extractImports(), getDomain(), scanFiles()

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (2): loadMeetings(), toggleMeetingCompleted()

### Community 57 - "Community 57"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 65 - "Community 65"
Cohesion: 0.67
Nodes (2): checkFile(), getDomain()

### Community 69 - "Community 69"
Cohesion: 0.67
Nodes (2): getSession(), handleReportGenerated()

### Community 85 - "Community 85"
Cohesion: 0.67
Nodes (2): createTasksForClient(), ensureClientTasks()

## Knowledge Gaps
- **Thin community `Community 13`** (18 nodes): `eventEmitter.ts`, `taskEvents.ts`, `EventEmitter`, `.clearHistory()`, `.createEvent()`, `.emit()`, `.getAllEvents()`, `.getClientEvents()`, `.loadFromLocalStorage()`, `.off()`, `.on()`, `.onAny()`, `.saveToLocalStorage()`, `emitTaskCreated()`, `emitTaskDeleted()`, `emitTasksBulkUpdated()`, `emitTaskUpdated()`, `useTaskEvents()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (9 nodes): `filterEmails()`, `formatDate()`, `handleArchive()`, `handleDelete()`, `handleEmailClick()`, `handleMarkAsRead()`, `handleMarkAsUnread()`, `loadEmails()`, `MailInboxTab.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (8 nodes): `calculerRevenuFoncier()`, `calculerValeursAutomatiques()`, `getBeneficiaireNom()`, `getBeneficiairesDisponibles()`, `handleAddRevenu()`, `handleDeleteRevenu()`, `handleSave()`, `RevenusImpositionForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (8 nodes): `chargerMontages()`, `chargerParametresDefaut()`, `comparerScenarios()`, `formatCurrency()`, `formatPercent()`, `handleMontageChange()`, `lancerSimulation()`, `SimulateurPatrimonial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (7 nodes): `applyTaskUpdate()`, `areAllTasksCompleted()`, `countTasksByState()`, `isTaskCompleted()`, `isValidTaskState()`, `validateTaskUpdate()`, `task_states.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (5 nodes): `getLocationIcon()`, `getMeetingTypeColor()`, `loadMeetings()`, `toggleMeetingCompleted()`, `ClientMeetings.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (4 nodes): `checkFile()`, `getAllFiles()`, `getDomain()`, `check-domains.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (4 nodes): `getSession()`, `handleReportGenerated()`, `loadClientData()`, `GelAvoirsTask.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (4 nodes): `ensureClientTasks.ts`, `createTasksForClient()`, `ensureClientTasks()`, `reloadClientTasks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSession()` connect `Community 2` to `Community 1`, `Community 10`, `Community 9`, `Community 25`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `verifyAuthFromCookie()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `getByPrefix()` connect `Community 0` to `Community 17`, `Community 3`, `Community 5`, `Community 15`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `getByPrefix()` (e.g. with `collecterDonneesClient()` and `getAuditsClient()`) actually correct?**
  _`getByPrefix()` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `getSession()` (e.g. with `verifyAuthFromCookie()` and `loadData()`) actually correct?**
  _`getSession()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `analyserProfilClient()` (e.g. with `rechercherPourAssistant()` and `searchMontages()`) actually correct?**
  _`analyserProfilClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `genererAuditComplet()` (e.g. with `genererRapportStructure()` and `.set()`) actually correct?**
  _`genererAuditComplet()` has 2 INFERRED edges - model-reasoned connections that need verification._