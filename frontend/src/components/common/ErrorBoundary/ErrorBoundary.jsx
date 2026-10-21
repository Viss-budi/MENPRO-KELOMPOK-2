import { Component } from 'react'
import ErrorPage from '../ErrorPage/ErrorPage'

// Menangkap error saat render (bug di komponen) dan menampilkan halaman 500,
// supaya pengunjung tidak melihat layar putih.
class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) return <ErrorPage variant="500" />
    return this.props.children
  }
}

export default ErrorBoundary
