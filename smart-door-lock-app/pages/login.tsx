import { Button, Flex, FormControl, FormLabel, Heading, Input } from "@chakra-ui/react"
import { NextPage } from "next"
import Head from "next/head"


const Login: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Login</title>
        <meta name="description" content="Enter your login details" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex justify={'center'}>
        <Flex direction={'column'} minWidth={300}>
          <Heading mt={128}>Login</Heading>
          <FormControl mt={4} isRequired>
            <FormLabel>Username / Email</FormLabel>
            <Input type='email' />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Password</FormLabel>
            <Input type='password' />
          </FormControl>
          <Button mt={4} paddingX={8} colorScheme='blue'>Login</Button>
        </Flex>
      </Flex>
    </div>
  )
}

export default Login