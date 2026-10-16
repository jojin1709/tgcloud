class TGUser {
  final int id;
  final String? username;
  final String firstName;
  final String? lastName;
  final String? phone;
  final bool isPremium;

  TGUser({
    required this.id,
    this.username,
    required this.firstName,
    this.lastName,
    this.phone,
    this.isPremium = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'is_premium': isPremium ? 1 : 0,
    };
  }

  factory TGUser.fromMap(Map<String, dynamic> map) {
    return TGUser(
      id: map['id'] as int,
      username: map['username'] as String?,
      firstName: map['first_name'] as String,
      lastName: map['last_name'] as String?,
      phone: map['phone'] as String?,
      isPremium: (map['is_premium'] as int? ?? 0) == 1,
    );
  }
}
