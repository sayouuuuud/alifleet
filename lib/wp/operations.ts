/**
 * Every WPGraphQL document the account system uses, kept in one place so the
 * exact contract with WordPress is auditable.
 *
 * Plugin ownership:
 *   login / refreshJwtAuthToken   → WPGraphQL JWT Authentication
 *   registerUser / sendPasswordResetEmail / viewer → WPGraphQL core
 *   customer / updateCustomer     → WooGraphQL
 */

export const LOGIN = /* GraphQL */ `
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      user {
        databaseId
        username
        email
        firstName
        lastName
        name
      }
    }
  }
`

export const REFRESH_TOKEN = /* GraphQL */ `
  mutation RefreshToken($refreshToken: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) {
      authToken
    }
  }
`

export const REGISTER_USER = /* GraphQL */ `
  mutation RegisterUser(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String
    $lastName: String
  ) {
    registerUser(
      input: {
        username: $username
        email: $email
        password: $password
        firstName: $firstName
        lastName: $lastName
      }
    ) {
      user {
        databaseId
        username
        email
      }
    }
  }
`

export const SEND_PASSWORD_RESET = /* GraphQL */ `
  mutation SendPasswordReset($username: String!) {
    sendPasswordResetEmail(input: { username: $username }) {
      clientMutationId
    }
  }
`

export const VIEWER = /* GraphQL */ `
  query Viewer {
    viewer {
      databaseId
      username
      email
      firstName
      lastName
      name
      registeredDate
    }
  }
`

const ADDRESS_FIELDS = /* GraphQL */ `
  firstName
  lastName
  company
  address1
  address2
  city
  state
  postcode
  country
  phone
`

/**
 * Dashboard + order history in a single round trip. `customer` resolves to the
 * WooCommerce customer bound to the authenticated JWT.
 */
export const CUSTOMER_WITH_ORDERS = /* GraphQL */ `
  query CustomerWithOrders($first: Int = 20) {
    customer {
      databaseId
      email
      firstName
      lastName
      displayName
      date
      billing {
        ${ADDRESS_FIELDS}
        email
      }
      shipping {
        ${ADDRESS_FIELDS}
      }
      orders(first: $first) {
        nodes {
          databaseId
          orderNumber
          date
          status
          total
          subtotal
          totalTax
          shippingTotal
          paymentMethodTitle
          lineItems {
            nodes {
              quantity
              total
              product {
                node {
                  name
                  slug
                }
              }
            }
          }
        }
      }
    }
  }
`

export const UPDATE_CUSTOMER_PROFILE = /* GraphQL */ `
  mutation UpdateCustomerProfile(
    $firstName: String
    $lastName: String
    $email: String
    $password: String
  ) {
    updateCustomer(
      input: {
        firstName: $firstName
        lastName: $lastName
        email: $email
        password: $password
      }
    ) {
      customer {
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`

export const UPDATE_CUSTOMER_ADDRESSES = /* GraphQL */ `
  mutation UpdateCustomerAddresses(
    $billing: CustomerAddressInput
    $shipping: CustomerAddressInput
  ) {
    updateCustomer(input: { billing: $billing, shipping: $shipping }) {
      customer {
        databaseId
      }
    }
  }
`
