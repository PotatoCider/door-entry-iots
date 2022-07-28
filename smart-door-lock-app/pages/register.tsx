import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Flex, Heading } from "@chakra-ui/layout";
import { NextPage } from "next";
import Head from "next/head";


const Register: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Register</title>
        <meta name="description" content="Enter your login details" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex justify={'center'}>
        <Flex direction={'column'} minWidth={300}>
          <Heading mt={128}>Register</Heading>
          <FormControl mt={4} isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input type='text' />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input type='email' />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>New Password</FormLabel>
            <Input type='password' />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Confirm New Password</FormLabel>
            <Input type='password' />
          </FormControl>
          <Button mt={4} paddingX={8} colorScheme='blue'>Register</Button>
        </Flex>
      </Flex>
    </div>


  )
}

export default Register