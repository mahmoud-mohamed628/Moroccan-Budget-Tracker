import 'package:isar/isar.dart';
import 'category.dart';

part 'transaction.g.dart';

/// Modèle Dépense / Revenu (Transaction) adapté aux usages marocains.
/// Enregistre les transactions locales et contient un IsarLink vers la Catégorie.
@collection
class Transaction {
  /// Identifiant local unique Isar
  Id id = Isar.autoIncrement;

  /// Identifiant universel unique Firestore (UUID)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Montant de la transaction en Dirham Marocain (DH / MAD)
  late double amount;

  /// Descriptif textuel de la dépense (ex: "Smen et Khobz chez l'épicier", "Kurs de Petit Taxi")
  late String description;

  /// Date et heure effectives de la transaction
  late DateTime date;

  /// Lien relationnel Isar vers l'objet Catégorie associé
  final category = IsarLink<Category>();

  /// Référence aplatie (Flat Ref) vers l'Id de catégorie Firestore
  /// Crucial pour maintenir les liens relationnels lors de la synchronisation Firestore
  late String categoryFirestoreId;

  /// Méthode de paiement employée (ex: "Espèces (Cash)", "Carte Bancaire", "Virement CIH")
  late String paymentMethod;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// État du document vis-à-vis de la synchronisation Cloud
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur par défaut requis par Isar
  Transaction();

  /// Constructeur nommé facilitant la création d'instances
  Transaction.create({
    required this.firestoreId,
    required this.amount,
    required this.description,
    required this.date,
    required this.categoryFirestoreId,
    required this.paymentMethod,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Instancie un objet Transaction depuis un dictionnaire de données Firebase (Map)
  factory Transaction.fromMap(Map<String, dynamic> map) {
    return Transaction.create(
      firestoreId: map['firestoreId'] ?? '',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      description: map['description'] ?? '',
      date: DateTime.parse(map['date'] ?? DateTime.now().toIso8601String()),
      categoryFirestoreId: map['categoryFirestoreId'] ?? '',
      paymentMethod: map['paymentMethod'] ?? 'Espèces',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Convertit la transaction en dictionnaire structuré prêt à être envoyé à Cloud Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'amount': amount,
      'description': description,
      'date': date.toIso8601String(),
      'categoryFirestoreId': categoryFirestoreId,
      'paymentMethod': paymentMethod,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}
