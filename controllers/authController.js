const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Semua field (name, email, password) wajib diisi!'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: 1,
        name,
        email
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi!'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token: 'mock_jwt_token_dummy_123456789',
        user: {
          id: 1,
          name: 'Dimas Faturohman',
          email
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};