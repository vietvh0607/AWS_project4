import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth');

const authCert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJWMni0yGwPQSyMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi10M2JrcGhxMmMxMDdhcHdyLnVzLmF1dGgwLmNvbTAeFw0yMjExMTUw
NzQxNTdaFw0zNjA3MjQwNzQxNTdaMCwxKjAoBgNVBAMTIWRldi10M2JrcGhxMmMx
MDdhcHdyLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAMOHHA3Pciv/IeiuD/r8bVvqoT4+LXEkHbfqR1Iv6+YK8D+9fCawRx+vqLg2
Np1YuQQcxHz4LpHIJTm0loctW6sZB02Ir48b7fnjGKeXdowl7mu7ZNy0dNI4WSqU
UfS+CdNndfuZo0gWFXKq8sAO3HSfTvp1v0AI5w33BLxj4qZbtsCxEVSkUpuv90eR
FCxWb6TTDgUlYDs9dQg7mjtJO6+5LMDJiMUXIgFiwyFAZAbS427472SHHcrXFl2x
f9zhxQpw80djlZ1s7m/WYlGT7PlVx/wJ5oDy0NVRpMA2S8fCRfUr30sywgTUqq/P
D41gbA+QUuMY8sGIKgJqWRxsaS8CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUtGKZxUhplt4LjVmjy+sQrbRv1BAwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQBngc8VNcRdzLGcmmHCEJNH1mHJOWycll3etxCEyY4w
ygzob9EKFm01GO9vlTvo8UqmzmqqT9DrDdYyCnL9RKNIjQgxXMSiG5SlEYk1zoAa
A5GmGrcD4UMQuKBoXQZCxYxr4FhCo5t0ic90/oNzAJGesz1/1/BWxoo8p8wpNm8G
H3wvDWJmiD/YcSdq1aCWk+Kj9N6wuqEq14PPo3guPfmVYBTgaU39WsMXXDMWIsSX
dLNsJBiuu1HfoGFTMXxVyA6YPyyNyHO8e25cp/Q3Zub5sjj9iCqmAF/ED9517/U4
/DSqiJ+SObZ5XwE7y4E+0vCYc55a2f5InF6TLD8bzLVr
-----END CERTIFICATE-----
`

export const handler = async ( event: CustomAuthorizerEvent ): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken);

  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info('User was authorized', jwtToken);
    const { sub } = jwtToken;
    return {
      principalId: sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);
  return verify(token, authCert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) {
    throw new Error('No authentication header');
  }
  if (!authHeader.toLowerCase().startsWith('bearer ')){
    throw new Error('Invalid authentication header');
  }
  const split = authHeader.split(' ');
  const token = split[1];
  return token;
}
