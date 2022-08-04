import '../styles/globals.css'
import { AppProps } from 'next/app'
import { Alert, AlertDescription, AlertIcon, AlertStatus, Box, ChakraProvider, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export type AppQueryParam = {
  info?: string
  success?: string
  error?: string
  warning?: string
}

type AlertData = {
  message: string
  status: AlertStatus
}

function MyApp({ Component, pageProps, router }: AppProps) {
  const [{ message, status }, setAlert] = useState<AlertData>({ message: '', status: 'info' })
  const { info, success, error, warning } = router.query

  useEffect(() => {
    let message: string | string[] = ''
    let status: AlertStatus = 'info'
    if (error) {
      message = error
      status = 'error'
    } else if (success) {
      message = success
      status = 'success'
    } else if (warning) {
      message = warning
      status = 'warning'
    } else if (info) {
      message = info
      status = 'info'
    }
    if (message instanceof Array) message = message[0]
    setAlert({ message, status })
  }, [info, success, error, warning])

  console.log(router.query)

  return (
    <ChakraProvider>

      <Flex justify='center'>
        <Flex direction='column' minWidth={300}>
          {/* A box is used as margin */}
          <Box h={128}></Box>

          {message &&
            <Alert mb={4} status={status}>
              <AlertIcon />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          }

          <Component {...pageProps} />
        </Flex>
      </Flex>
    </ChakraProvider>
  )
}

// does not work
// MyApp.getServerSideProps = withIronSessionSsr(
//   async function getServerSideProps({ req }) {
//     let destination = null
//     console.log(req.url)
//     if (!req.session.user && req.url !== '/register')
//       destination = '/login'
//     if (req.session.user && (req.url === '/login' || req.url === '/register'))
//       destination = '/dashboard'

//     if (destination)
//       return {
//         redirect: {
//           destination,
//           permanent: false,
//         }
//       }
//     else
//       return { props: {} }
//   },
//   sessionOptions,
// )

export default MyApp
