import 'package:isar/isar.dart';

part 'user.g.dart';

/// Modèle Utilisateur pour Isar DB et Firestore.
/// Réfère à l'utilisateur authentifié.
@collection
class User {
  /// Identifiant local Isar (auto-incrémenté)
  Id id = Isar.autoIncrement;

  /// Référence unique Firestore (Équivalent au UID de Firebase Auth)
  @Index(unique: true, replace: true)
  late String firestoreRefId;

  /// Nom complet ou pseudonyme
  late String name;

  /// Adresse email
  late String email;

  /// Budget limite configuré par mois en Dirhams (MAD)
  late double monthlyBudgetLimit;

  /// Langue de préférence locale de l'utilisateur : 'fr' (Français), 'ar' (Arabe), 'darija' (Darija)
  late String preferredLang;

  /// Horodatage de la dernière modification locale ou distante
  late DateTime updatedAt;

  /// Drapeau déterminant si l'entrée locale est conforme ou en attente d'envoi vers Firestore
  late bool isSynced;

  /// Constructeur par défaut requis par Isar
  User();

  /// Constructeur nommé pour simplifier l'initialisation
  User.create({
    required this.firestoreRefId,
    required this.name,
    required this.email,
    required this.monthlyBudgetLimit,
    required this.preferredLang,
    required this.updatedAt,
    this.isSynced = false,
  });

  /// Factory d'instanciation de données depuis Firestore (Map)
  factory User.fromMap(Map<String, dynamic> map) {
    return User.create(
      firestoreRefId: map['firestoreRefId'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      monthlyBudgetLimit: (map['monthlyBudgetLimit'] as num?)?.toDouble() ?? 0.0,
      preferredLang: map['preferredLang'] ?? 'fr',
      updatedAt: DateTime.parse(map['updatedAt'] ?? DateTime.now().toIso8601String()),
      isSynced: true,
    );
  }

  /// Exporte l'objet sous format Map utilisable directement par Firebase Firestore
  Map<String, dynamic> toMap() {
    return {
      'firestoreRefId': firestoreRefId,
      'name': name,
      'email': email,
      'monthlyBudgetLimit': monthlyBudgetLimit,
      'preferredLang': preferredLang,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
