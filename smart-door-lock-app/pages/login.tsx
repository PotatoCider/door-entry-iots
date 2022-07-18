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
        <Flex direction={'column'}>
          <Heading mt={128}>Login</Heading>
          <FormControl mt={4}>
            <FormLabel>Username / Email</FormLabel>
            <Input mb={4} type='email' />
            <FormLabel>Password</FormLabel>
            <Input mb={4} type='password' />
            <Button paddingX={8} colorScheme='blue'>Login</Button>
          </FormControl>
        </Flex>
      </Flex>
    </div >
  )
}

export default Login