import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Link, Text } from "@chakra-ui/react"
import { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"
import { RequestData, ResponseData } from "./api/login"
import { SubmitHandler, useForm } from 'react-hook-form'

type Inputs = RequestData

const Login: NextPage = () => {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>()
  const [error, setError] = useState('')

  // called when form is submitted
  const onSubmit: SubmitHandler<Inputs> = (data) => fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(res => res.json())
    .then((data: ResponseData) => {
      if (data.ok) router.push('/dashboard')
      else setError(data.error ?? '')
    })

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

          <form onSubmit={handleSubmit(onSubmit)}>

            <FormControl mt={4} isRequired isInvalid={!!errors.login}>
              <FormLabel>Username/Email</FormLabel>
              <Input type='text' {...register("login", {
                maxLength: { value: 254, message: 'Username/Email cannot exceed 254 chars' },
              })} />
              <FormErrorMessage>{errors.login?.message}</FormErrorMessage>
            </FormControl>

            <FormControl mt={4} isRequired isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input type='password' {...register("password", {
                maxLength: { value: 64, message: 'Password cannot exceed 64 chars' },
              })} />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>

            <Alert status='error' display={error ? undefined : 'none'} mt={4}>
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button type='submit' minWidth={300} mt={4} paddingX={8} colorScheme='blue'>Login</Button>
          </form>

          <Text m='auto' mt={4}>
            New here?{' '}
            <Link href='/register' color='teal.500'>Register</Link>
          </Text>

        </Flex>
      </Flex>
    </div >
  )
}

export default Login