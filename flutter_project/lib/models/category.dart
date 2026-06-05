import 'package:isar/isar.dart';

part 'category.g.dart';

/// Modèle Catégorie pour organiser les transactions.
/// Exemple : Hanout, Souk, Grand Taxi, Café, Loyers, Facture Lydec.
@collection
class Category {
  /// Identifiant local Isar
  Id id = Isar.autoIncrement;

  /// Identifiant universel unique Firestore (UUI)
  @Index(unique: true, replace: true)
  late String firestoreId;

  /// Nom de la catégorie en Français (ex: 'Épicier/Hanout')
  late String nameFr;

  /// Nom de la catégorie en Arabe (ex: 'البقال / الحانوت')
  late String nameAr;

  /// Clé identifiant l'icône à afficher (ex: 'grocery', 'taxi', 'coffee')
  late String icon;

  /// Code Hexadécimal de couleur pour le thème visuel (ex: '#028A4F')
  late String color;

  /// Budget alloué mensuel optionnel pour cette catégorie spécifique (en MAD)
  double? monthlyBudget;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// Indicateur de synchronisation avec le Cloud Firestore
  late bool isSynced;

  /// Drapeau pour suppression logique ("Soft Delete") hors-ligne
  late bool isDeleted;

  /// Constructeur requis par Isar
  Category();

  /// Constructeur nommé pour initiations directes
  Category.create({
    required this.firestoreId,
    required this.nameFr,
    required this.nameAr,
    required this.icon,
    required this.color,
    this.monthlyBudget,
    required this.updatedAt,
    this.isSynced = false,
    this.isDeleted = false,
  });

  /// Factory d'instanciation de données depuis Firestore (Map)
  factory Category.fromMap(Map<String, dynamic> map) {
    return Category.create(
      firestoreId: map['firestoreId'] ?? '',
      nameFr: map['nameFr'] ?? '',
      nameAr: map['nameAr'] ?? '',
      icon: map['icon'] ?? 'category',
      color: map['color'] ?? '#028A4F',
      monthlyBudget: (map['monthlyBudget'] as num?)?.toDouble(),
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  /// Exporte l'objet sous format Map utilisable directement par Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreId': firestoreId,
      'nameFr': nameFr,
      'nameAr': nameAr,
      'icon': icon,
      'color': color,
      'monthlyBudget': monthlyBudget,
      'updatedAt': updatedAt.toIso8601String(),
      'isDeleted': isDeleted,
    };
  }
}
