import { Link } from '@chakra-ui/react'
import { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { withSessionSsr } from '../lib/session'
import styles from '../styles/Home.module.css'

export const getServerSideProps = withSessionSsr(
  async function getServerSideProps({ req }) {
    if (!req.session.user) return {
      redirect: {
        destination: '/login',
        permanent: false,
      }
    }
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      }
    }
  }
)

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>IOTS Project </title>
        <meta name='description' content='Created By Joseph and Hong Wei' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title} style={{ color: 'blue' }}>
          Smart DoorLocker 2.0  <a href='https://nextjs.org'></a>
        </h1>

        <p className={styles.description}>
          <Link href='/login' color='teal.500' id='meow'>Login</Link>
        </p>

        <p className={styles.description}>
          <Link href='/register' color='teal.500'>Register</Link>
        </p>

        <div className={styles.grid}>
          <a href='https://nextjs.org/docs' className={styles.card}>
            <h2>Door Lock  &rarr;</h2>
            <p>Choose to close or Open the door System of your House .</p>
          </a>

          <a href='https://nextjs.org/learn' className={styles.card}>
            <h2>WebCam  &rarr;</h2>
            <p>Check Front Door Footage of your House </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href='https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src='/vercel.svg' alt='Vercel Logo' width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
