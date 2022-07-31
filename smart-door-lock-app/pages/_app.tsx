import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { withIronSessionSsr } from 'iron-session/next'
import { sessionOptions } from '../lib/session'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

MyApp.getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req }) {
    let destination = null
    console.log(req.url)
    if (!req.session.user && req.url !== '/register')
      destination = '/login'
    if (req.session.user && (req.url === '/login' || req.url === '/register'))
      destination = '/dashboard'

    if (destination)
      return {
        redirect: {
          destination,
          permanent: false,
        }
      }
    else
      return { props: {} }
  },
  sessionOptions,
)

export default MyApp
