// controllers/auth.controller.js

const login = async (req, res) => {
    try {
        const { password } = req.body;
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!password) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu.' });
        }

        if (password === correctPassword) {
            // Mật khẩu đúng
            res.status(200).json({ message: 'Đăng nhập thành công.' });
        } else {
            // Mật khẩu sai
            res.status(401).json({ message: 'Mật khẩu không chính xác.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
};

// Đảm bảo export đúng cách trong một object
module.exports = {
    login,
};