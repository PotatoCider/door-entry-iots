import { Flex, Heading, Button, FormControl, FormLabel, Input, Text, Alert, AlertIcon, AlertDescription, Box, Checkbox, useClipboard } from '@chakra-ui/react'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetchJSON } from '../lib/api'
import { withSessionSsr } from '../lib/session'
import { ResponseData } from './api/door'

type Props = {
  device_token?: string
  username?: string
}

export const getServerSideProps = withSessionSsr<Props>(
  async function getServerSideProps({ req }) {
    if (!req.session.user) return {
      redirect: {
        destination: '/login?error=' + encodeURIComponent('You are not logged in.'),
        permanent: false,
      }
    }

    const { device_token, username } = req.session.user
    return { props: { device_token, username } }
  }
)

const Dashboard: NextPage<Props> = ({ device_token, username }) => {
  const [timeout, setDoorTimeout] = useState(30000)
  const [isDoorOpen, setDoorOpen] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const { hasCopied, onCopy } = useClipboard(device_token ?? '')

  const router = useRouter()

  const syncDoorState = () =>
    fetchJSON<ResponseData>(`/api/door`, 'GET', undefined, {
      'Authorization': `Bearer ${device_token}`
    })
      .then(data => setDoorOpen(data.door_open ?? false))

  const onOpenDoorClick = () =>
    fetchJSON<ResponseData>(`/api/door`, 'POST', { timeout }, {
      'Authorization': `Bearer ${device_token}`
    })
      .then(data => setDoorOpen(data.door_open ?? false))

  const onLogoutClick = () => fetchJSON('/api/logout', 'POST')
    .then(data => router.push('/login', {
      query: data.ok ? { success: 'Sucessfully logged out' } : { error: data.error },
    }))

  useEffect(() => {

    const i = setInterval(syncDoorState, 500)

    return () => clearInterval(i)
  })

  return (
    <Flex direction='column' minWidth={300}>
      <Head>
        <title>Dashboard</title>
        <meta name='description' content='Dashboard' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      {/* {message &&
        <Alert mb={4} status='info'>
          <AlertIcon />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      } */}

      <Heading>{username}&apos;s Dashboard</Heading>

      <Box h={4} />

      {/* <FormControl mt={4}>
        <FormLabel>Timeout</FormLabel>
        <Flex direction='row' align='baseline'>
          <Input value={timeout} onChange={e => setDoorTimeout(isNaN(+e.target.value) ? timeout : +e.target.value)} />
          <Text ml={2}>ms</Text>
        </Flex>
      </FormControl> */}

      <Text size='md' mt={4}>
        The door is <b>{isDoorOpen ? 'open' : 'closed'}</b>.
      </Text>
      <Button onClick={onOpenDoorClick} mt={4} paddingX={8} colorScheme='blue'>
        {isDoorOpen ? 'Close' : 'Open'} Door
      </Button>

      <Box h={4} />

      <Text mt={4}><b>Device Token</b></Text>
      <Flex direction='row' align='baseline' justify='space-between'>
        <Text>
          <b>
            {showToken ? device_token : '*'.repeat(32)}
          </b>
        </Text>
        <Button onClick={() => setShowToken(!showToken)} ml={2}>
          Show
        </Button>
        <Button onClick={onCopy} ml={2} colorScheme='blue'>
          {hasCopied ? 'Copied' : 'Copy'}
        </Button>
      </Flex>

      <Box h={4} />

      <Button onClick={onLogoutClick} mt={4} paddingX={8} colorScheme='red'>
        Logout
      </Button>
    </Flex >
  )
}

export default Dashboard