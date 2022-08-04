import { Alert, AlertDescription, AlertIcon, Button, Flex, Heading, Link, Text } from '@chakra-ui/react'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { RequestData, ResponseData } from './api/login'
import { SubmitHandler, useForm } from 'react-hook-form'
import FormField from '../components/FormField'
import { fetchJSON } from '../lib/api'

export async function getServerSideProps() { return { props: {} } }

type Inputs = RequestData

const Login: NextPage = () => {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>()
  const [error, setError] = useState('')

  // called when form is submitted
  const onSubmit: SubmitHandler<Inputs> = data =>
    fetchJSON('/api/login', 'POST', data)
      .then(data => {
        if (data.ok) router.push({
          pathname: '/dashboard',
          query: { success: 'Successfully logged in' },
        })
        else setError(data.error ?? '')
      })

  return (
    <Flex direction='column' minWidth={300}>
      <Head>
        <title>Login</title>
        <meta name='description' content='Enter your login details' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Heading>Login</Heading>

      <form onSubmit={handleSubmit(onSubmit)}>

        <FormField required name='login' type='text' label='Username/Email'
          error={errors.login} r={register}
          options={{
            maxLength: { value: 254, message: 'Username/Email cannot exceed 254 chars' },
          }}
        />
        <FormField required name='password' type='password' label='Password'
          error={errors.password} r={register}
          options={{
            maxLength: { value: 64, message: 'Password cannot exceed 64 chars' },
          }}
        />

        {error &&
          <Alert status='error' mt={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        <Button type='submit' minWidth={300} mt={4} paddingX={8} colorScheme='blue'>Login</Button>
      </form>
      <Text m='auto' mt={4}>
        New here?{' '}
        <Link href='/register' color='teal.500'>Register</Link>
      </Text>
    </Flex>
  )
}

export default Login