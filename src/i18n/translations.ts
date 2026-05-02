export type Locale = "fr" | "en";

const translations = {
  fr: {
    // HUD / AppLayout
    "hud.status": "● EN LIGNE",
    "hud.tutorial": "Tutoriel — Comment utiliser l'app",
    "tab.contracts": "Contrats",
    "tab.placement": "Placement",

    // CapacityPanel
    "capacity.inBay": "En soute",
    "capacity.available": "Disponible",
    "capacity.delivered": "SCU livrés",

    // ContractForm
    "contractForm.title": "Contrat de Hauling",
    "contractForm.titleEdit": "Modifier contrat",
    "contractForm.name": "Nom du contrat",
    "contractForm.maxSize": "Taille max des caisses",
    "contractForm.deliveries": "Livraisons",
    "contractForm.deliveryLabel": "LIVRAISON_",
    "contractForm.scu": "Quantité (SCU)",
    "contractForm.commodity": "Ressource",
    "contractForm.destination": "Destination",
    "contractForm.pickupLocation": "Lieu de chargement",
    "contractForm.pickupPlaceholder": "Où charger cette livraison...",
    "contractForm.addDelivery": "+ Ajouter une livraison",
    "contractForm.submit": "Ajouter",
    "contractForm.save": "Enregistrer",
    "contractForm.cancel": "Annuler",
    "contractForm.choosePlaceholder": "— Choisir —",

    // ManualCargoForm
    "manualForm.title": "Chargement personnalisé",
    "manualForm.name": "Nom du chargement",
    "manualForm.namePlaceholder": "Nom du chargement",
    "manualForm.pickupLocation": "Chargement (opt.)",
    "manualForm.pickupPlaceholder": "Origine...",
    "manualForm.destination": "Destination",
    "manualForm.destinationPlaceholder": "Tap pour filtrer...",
    "manualForm.crates": "Caisses",
    "manualForm.quantity": "Quantité",
    "manualForm.size": "Taille",
    "manualForm.choosePlaceholder": "— Choisir —",
    "manualForm.addRow": "+ Ligne",
    "manualForm.submit": "✓ Ajouter le chargement",

    // CargoPlanner
    "planner.deleteAll": "✕ Supprimer tous les contrats",
    "planner.deleteConfirm": "Confirmer",
    "planner.deleteCancel": "Annuler suppression",
    "planner.undo": "↩ Annuler",

    // ContractList
    "contractList.title": "Contrats",
    "contractList.overflow": "⚠ DÉBORDEMENT",
    "contractList.maxCrate": "Max caisse",
    "contractList.destinations": "Destinations",
    "contractList.retract": "↩ Retirer",
    "contractList.remaining": "SCU restants à placer",
    "contractList.edit": "Modifier",
    "contractList.delete": "Supprimer",
    "contractList.bay": "Soute",

    // PendingDeliveriesPanel
    "pending.title": "Livraisons",
    "pending.waiting": "en attente",
    "pending.loaded": "chargée",
    "pending.delivered": "livrée",
    "pending.activate": "Activer",
    "pending.markDone": "✓ Livré",
    "pending.marked": "◉ Marqué",
    "pending.mark": "◎ Marquer",
    "pending.deactivate": "↩ Annuler",
    "pending.instructionClick": "▶ Cliquez sur une livraison pour la placer dans la soute",
    "pending.instructionBay": "▶ Cliquez sur une soute dans la vue 3D",
    "pending.inBay": "En soute",
    "pending.clearConfirm": "✓ Confirmer",
    "pending.clearCancel": "✕ Annuler",
    "pending.clearBay": "✕ Vider la soute",
    "pending.cancelSelection": "✕ Annuler sélection",
    "pending.cancelMark": "✕ Annuler marquage",
    "pending.waitingSection": "En attente",
    "pending.deliveredSection": "Livrées",
    "pending.retract": "↩ Retirer",
    "pending.example": "EXEMPLE",

    // SearchableSelect
    "select.filterPlaceholder": "Tape quelques lettres...",

    // Scene 3D
    "scene.bay": "SOUTE",
    "scene.ramp": "ARRIÈRE",
    "scene.front": "AVANT",
    "scene.clickBay": "Cliquez sur une soute pour assigner",
  },

  en: {
    // HUD / AppLayout
    "hud.status": "● ONLINE",
    "hud.tutorial": "Tutorial — How to use the app",
    "tab.contracts": "Contracts",
    "tab.placement": "Placement",

    // CapacityPanel
    "capacity.inBay": "In bay",
    "capacity.available": "Available",
    "capacity.delivered": "SCU delivered",

    // ContractForm
    "contractForm.title": "Hauling Contract",
    "contractForm.titleEdit": "Edit contract",
    "contractForm.name": "Contract name",
    "contractForm.maxSize": "Max crate size",
    "contractForm.deliveries": "Deliveries",
    "contractForm.deliveryLabel": "DELIVERY_",
    "contractForm.scu": "Quantity (SCU)",
    "contractForm.commodity": "Commodity",
    "contractForm.destination": "Destination",
    "contractForm.pickupLocation": "Pickup location",
    "contractForm.pickupPlaceholder": "Where to pick up this delivery...",
    "contractForm.addDelivery": "+ Add a delivery",
    "contractForm.submit": "Add",
    "contractForm.save": "Save",
    "contractForm.cancel": "Cancel",
    "contractForm.choosePlaceholder": "— Choose —",

    // ManualCargoForm
    "manualForm.title": "Custom Cargo",
    "manualForm.name": "Cargo name",
    "manualForm.namePlaceholder": "Cargo name",
    "manualForm.pickupLocation": "Pickup (opt.)",
    "manualForm.pickupPlaceholder": "Origin...",
    "manualForm.destination": "Destination",
    "manualForm.destinationPlaceholder": "Type to filter...",
    "manualForm.crates": "Crates",
    "manualForm.quantity": "Quantity",
    "manualForm.size": "Size",
    "manualForm.choosePlaceholder": "— Choose —",
    "manualForm.addRow": "+ Row",
    "manualForm.submit": "✓ Add cargo",

    // CargoPlanner
    "planner.deleteAll": "✕ Delete all contracts",
    "planner.deleteConfirm": "Confirm",
    "planner.deleteCancel": "Cancel deletion",
    "planner.undo": "↩ Undo",

    // ContractList
    "contractList.title": "Contracts",
    "contractList.overflow": "⚠ OVERFLOW",
    "contractList.maxCrate": "Max crate",
    "contractList.destinations": "Destinations",
    "contractList.retract": "↩ Remove",
    "contractList.remaining": "SCU left to place",
    "contractList.edit": "Edit",
    "contractList.delete": "Delete",
    "contractList.bay": "Bay",

    // PendingDeliveriesPanel
    "pending.title": "Deliveries",
    "pending.waiting": "waiting",
    "pending.loaded": "loaded",
    "pending.delivered": "delivered",
    "pending.activate": "Activate",
    "pending.markDone": "✓ Delivered",
    "pending.marked": "◉ Marked",
    "pending.mark": "◎ Mark",
    "pending.deactivate": "↩ Cancel",
    "pending.instructionClick": "▶ Click a delivery to place it in a bay",
    "pending.instructionBay": "▶ Click a bay in the 3D view",
    "pending.inBay": "In bay",
    "pending.clearConfirm": "✓ Confirm",
    "pending.clearCancel": "✕ Cancel",
    "pending.clearBay": "✕ Clear bay",
    "pending.cancelSelection": "✕ Cancel selection",
    "pending.cancelMark": "✕ Clear marks",
    "pending.waitingSection": "Waiting",
    "pending.deliveredSection": "Delivered",
    "pending.retract": "↩ Remove",
    "pending.example": "EXAMPLE",

    // SearchableSelect
    "select.filterPlaceholder": "Type a few letters...",

    // Scene 3D
    "scene.bay": "BAY",
    "scene.ramp": "REAR",
    "scene.front": "FRONT",
    "scene.clickBay": "Click a bay to assign",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

export function getTranslations(locale: Locale) {
  return translations[locale];
}
