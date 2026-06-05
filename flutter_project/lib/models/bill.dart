import 'package:isar/isar.dart';

part 'bill.g.dart';

/// Modèle pour les Factures Courantes au Maroc (Lydec, ONEE, Redal, etc.).
/// Permet d'enregistrer des rappels de factures avec leur statut de paiement.
@collection
class Bill {
  /// Identifiant local Isar
  Id id = Isar.autoIncrement;

  /// Référence universelle unique Cloud Firestore (UUID)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Intitulé de la facture en Français (ex: "Facture Eau & Électricité")
  late String titleFr;

  /// Intitulé de la facture en Arabe (ex: "فاتورة الماء والكهرباء")
  late String titleAr;

  /// Montant estimé ou exact en Dirhams (MAD)
  late double amount;

  /// Date d'échéance de règlement de la facture
  late DateTime dueDate;

  /// Fournisseur / Régie de services marocain :
  /// ex: Lydec (Casablanca), Redal (Rabat), Amendis (Tanger), Radeema (Marrakech), ONEE, Maroc Telecom, Orange, Inwi.
  late String provider;

  /// Drapeau signalant si la facture a été intégralement acquittée
  late bool isPaid;

  /// Date effective de versement (si acquittée)
  DateTime? paidAt;

  /// Périodicité du prélèvement (ex: 'Mensuel', 'Trimestriel', 'Unique')
  late String recurrence;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// État actuel de synchronisation vis-à-vis de Firebase Firestore
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur par défaut requis par Isar
  Bill();

  /// Constructeur nommé pour faciliter l'initialisation de données
  Bill.create({
    required this.firestoreId,
    required this.titleFr,
    required this.titleAr,
    required this.amount,
    required this.dueDate,
    required this.provider,
    required this.isPaid,
    this.paidAt,
    required this.recurrence,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Instancie un objet Bill depuis un dictionnaire Firestore (Map)
  factory Bill.fromMap(Map<String, dynamic> map) {
    return Bill.create(
      firestoreId: map['firestoreId'] ?? '',
      titleFr: map['titleFr'] ?? '',
      titleAr: map['titleAr'] ?? '',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      dueDate: DateTime.parse(map['dueDate'] ?? DateTime.now().toIso8601String()),
      provider: map['provider'] ?? 'Autre',
      isPaid: map['isPaid'] ?? false,
      paidAt: map['paidAt'] != null ? DateTime.parse(map['paidAt']) : null,
      recurrence: map['recurrence'] ?? 'Mensuel',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Convertit la facture en dictionnaire pour Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'titleFr': titleFr,
      'titleAr': titleAr,
      'amount': amount,
      'dueDate': dueDate.toIso8601String(),
      'provider': provider,
      'isPaid': isPaid,
      'paidAt': paidAt?.toIso8601String(),
      'recurrence': recurrence,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}
