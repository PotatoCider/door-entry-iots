import { Flex, Heading, Button, FormControl, FormLabel, Input, Text, Alert, AlertIcon, AlertDescription, Box } from '@chakra-ui/react'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetchJSON } from '../lib/api'
import { ResponseData } from './api/door'

export async function getServerSideProps() { return { props: {} } }

const Dashboard: NextPage = () => {
  const [timeout, setDoorTimeout] = useState(5000)
  const [isDoorOpen, setDoorOpen] = useState(false)

  const router = useRouter()

  const syncDoorState = () => fetchJSON<ResponseData>('/api/door')
    .then(data => setDoorOpen(data.is_open))

  const onOpenDoorClick = () => fetchJSON<ResponseData>('/api/door', 'POST', { timeout })
    .then(data => setDoorOpen(data.is_open))

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

      <Heading>Dashboard</Heading>

      <FormControl mt={4}>
        <FormLabel>Timeout</FormLabel>
        <Flex direction='row' align='baseline'>
          <Input value={timeout} onChange={e => setDoorTimeout(isNaN(+e.target.value) ? timeout : +e.target.value)} />
          <Text ml={2}>ms</Text>
        </Flex>
      </FormControl>

      <Button onClick={onOpenDoorClick} mt={4} paddingX={8} colorScheme='blue'>
        Open Door
      </Button>

      <Text mt={4}>
        The door is {isDoorOpen ? 'open' : 'closed'}.
      </Text>

      <Button onClick={onLogoutClick} mt={4} paddingX={8} colorScheme='red'>
        Logout
      </Button>
    </Flex>
  )
}

export default Dashboard