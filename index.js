import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:mysql1/mysql1.dart';
import 'dart:convert';
import 'package:mark_v3/services/database_service.dart';
import 'package:http/http.dart' as http;

//Autor: Josue Hernandez
class ProfileconService {
  final DatabaseService _dbService = DatabaseService();

  Future<Map<String, dynamic>> getUserData(
      String collaboratorId, String idUs) async {
    final url = Uri.parse(
        'https://flutter-production-c437.up.railway.app/userData/$collaboratorId/$idUs');

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('Datos!!!!!!!!!!!!! Usuario: $data');

        return Map<String, dynamic>.from(data);
      } else if (response.statusCode == 404) {
        throw Exception('Usuario no encontrado');
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } catch (e) {
      print('Error en la petición: $e');
      rethrow;
    }
  }

  Future<void> updateUserData({
    required String userId,
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String mobilPhone,
    required String address,
    required String dateOfBirth,
    required String employeeNum,
    required String idJobTitle,
    required String idMainAccount,
  }) async {
    final url = Uri.parse(
        'https://flutter-production-c437.up.railway.app/updateUserData');

    final body = {
      'userId': userId,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'mobilPhone': mobilPhone,
      'address': address,
      'dateOfBirth': dateOfBirth,
      'employeeNum': employeeNum,
      'idJobTitle': idJobTitle,
      'idMainAccount': idMainAccount,
    };

    try {
      final response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        print('✅ Usuario actualizado correctamente');
      } else {
        print('⚠️ Error del servidor: ${response.statusCode}');
        print('Respuesta: ${response.body}');
        throw Exception('Error al actualizar usuario');
      }
    } catch (e) {
      print('❌ Error en la petición: $e');
      rethrow;
    }
  }

  Future<bool> updatePassword({
    required String usuario,
    required String currentPassword,
    required String newPassword,
    required String idMainAccount,
  }) async {
    final url = Uri.parse(
        'https://flutter-production-c437.up.railway.app/updatePassword');

    final body = {
      'usuario': usuario,
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'idMainAccount': idMainAccount,
    };

    try {
      final response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        debugPrint('Respuesta: ${json['message']}');
        return true;
      } else {
        final error = jsonDecode(response.body)['error'];
        debugPrint('Error: $error');
        return false;
      }
    } catch (e) {
      debugPrint('Error al actualizar contraseña: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> obtenerLicenciaPorColaborador(
      String idCollabo) async {
    final url = Uri.parse(
        'https://flutter-production-c437.up.railway.app/licencia/$idCollabo');

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('Datos!!!!!!!!!!!!! de la licencia de conducir: $data');
        return data;
      } else if (response.statusCode == 404) {
        throw Exception('Licencia no encontrada');
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error al obtener la licencia: $e');
      rethrow;
    }
  }

Future<bool> agregarNuevaLicencia(Map<String, String?> map) async {
  final url = Uri.parse('https://flutter-production-c437.up.railway.app/addLicense'); // <-- Asegúrate de cambiarlo

  try {
    // Validar campos obligatorios
    if (map['idCollaborator'] == null ||
        map['licNum'] == null ||
        map['licClass'] == null ||
        map['dueDate'] == null) {
      print('Faltan datos obligatorios en el mapa');
      return false;
    }

    final body = jsonEncode({
      'idCollaborator': int.tryParse(map['idCollaborator']!), // <- Asegúrate que sea int
      'licNum': map['licNum'],
      'licClass': map['licClass'],
      'dueDate': map['dueDate'], // <- Ya debe venir en formato ISO desde el widget
    });

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['success'] == true;
    } else {
      print('Error del servidor: ${response.statusCode}');
      print('Respuesta: ${response.body}');
      return false;
    }
  } catch (e) {
    print('Error al agregar la licencia: $e');
    return false;
  }
}

}
