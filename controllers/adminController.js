const db = require('../config/db');
const response = require('../utils/response');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


//Auth
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password){
        return response.error(res, 'Username & Password wajib ada', 400);
    }

    db.query(
        'SELECT * FROM admin WHERE username = ?',
        [username],
        async (err, result) => {
            if(err) return response.error(res, 'Server Error');

            if(result.lenght === 0){
                return response.error(res, 'User Tidak Ditemukan', 404);
            }

            const user = result[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch){
                return response.error(res, 'Password Salah', 401);
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username
                },
                process.env.JWT_SECRET,
                {expiresIn: '1d'}
            );

            return response.success(res,{
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            }, 'Login Sukses');
        }
    );
};

//Logout
exports.logout = (req, res) => {
    return response.success(res, null, 'Logout berhasil');
};

// REGISTER ADMIN
exports.register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return response.error(res, 'Semua field wajib', 400);
    }

    if (password.length < 6) {
        return response.error(res, 'Password minimal 6 karakter', 400);
    }

    try {
        // CEK USER SUDAH ADA
        db.query(
            'SELECT * FROM admin WHERE username = ?',
            [username],
            async (err, result) => {
                if (err) return response.error(res, 'Server error');

                if (result.length > 0) {
                    return response.error(res, 'Username sudah digunakan', 400);
                }

                // HASH PASSWORD
                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    'INSERT INTO admin (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    (err) => {
                        if (err) {
                            console.log(err);
                            return response.error(res, 'Gagal register');
                        }

                        return response.success(res, null, 'Admin berhasil dibuat');
                    }
                );
            }
        );

    } catch (err) {
        console.log(err);
        return response.error(res, 'Server error');
    }
};