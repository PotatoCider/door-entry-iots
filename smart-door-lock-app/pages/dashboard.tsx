import { Flex, Heading, Button, FormControl, FormLabel, Input, Text } from "@chakra-ui/react"
import { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import { ResponseData } from "./api/door"

const Dashboard: NextPage = () => {
  const [timeout, setDoorTimeout] = useState(5000)
  const [isDoorOpen, setDoorOpen] = useState(false)


  useEffect(() => {
    const getDoorState = () => fetch('/api/door')
      .then(res => res.json())
      .then((data: ResponseData) => setDoorOpen(data.is_open))
    const i = setInterval(getDoorState, 500)

    return () => clearInterval(i)
  })

  return (
    <div>
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex justify={'center'}>
        <Flex direction={'column'} minWidth={300}>
          <Heading mt={128}>Dashboard</Heading>
          <FormControl mt={4}>
            <FormLabel>Timeout</FormLabel>
            <Flex direction='row' align='baseline'>
              <Input value={timeout} onChange={e => setDoorTimeout(isNaN(+e.target.value) ? timeout : +e.target.value)} />
              <Text ml={2}>ms</Text>
            </Flex>
          </FormControl>

          <Button onClick={
            () => fetch('/api/door', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timeout }),
            }).then(res => res.json())
              .then((data: ResponseData) => setDoorOpen(data.is_open))
          } mt={4} paddingX={8} colorScheme='blue'>Open Door</Button>

          <Text mt={4}>The door is {isDoorOpen ? 'open' : 'closed'}.</Text>
        </Flex>
      </Flex>
    </div>
  )
}

export default Dashboard