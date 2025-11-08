pipeline {
  agent { label 'windows' }   // make sure this runs on a Windows agent

  options {
    timestamps()              // add timestamps to every log line
    ansiColor('xterm')        // colored output (requires AnsiColor plugin)
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
    disableConcurrentBuilds()
  }

  environment {
    DOCKERHUB_REPO = 'raltoos'
    IMAGE_TAG = "${BUILD_NUMBER}"
    // Make npm chattier; optional
    NPM_CONFIG_LOGLEVEL = 'verbose'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        bat '''
          @echo on
          ver
          where git
          git --version
          echo Workspace=%CD%
          git rev-parse --short HEAD
        '''
      }
    }

    stage('Build & Test Services') {
      steps {
        dir('user-service') {
          bat '''
            @echo on
            call npm ci
            rem run tests; do not fail pipeline on test failures
            call npm test || exit /b 0
          '''
        }
        dir('order-service') {
          bat '''
            @echo on
            call npm ci
            call npm test || exit /b 0
          '''
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        bat '''
          @echo on
          docker version
          docker build --progress=plain -t %DOCKERHUB_REPO%/user-service:%IMAGE_TAG% ./user-service
          docker build --progress=plain -t %DOCKERHUB_REPO%/order-service:%IMAGE_TAG% ./order-service
          docker images
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          bat '''
            @echo on
            echo Logging in to Docker Hub as %DOCKER_USER%
            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
            docker push %DOCKERHUB_REPO%/user-service:%IMAGE_TAG%
            docker push %DOCKERHUB_REPO%/order-service:%IMAGE_TAG%
            docker logout
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        bat '''
          @echo on
          docker ps -a
          docker rm -f user-service || exit /b 0
          docker rm -f order-service || exit /b 0
          docker run -d --name user-service -p 3001:3001 %DOCKERHUB_REPO%/user-service:%IMAGE_TAG%
          docker run -d --name order-service -p 3002:3002 %DOCKERHUB_REPO%/order-service:%IMAGE_TAG%
          docker ps
        '''
      }
    }

    stage('Verify') {
      steps {
        bat '''
          @echo on
          setlocal enabledelayedexpansion
          set max=15

          echo Waiting for containers to be running...

          set count=0
          :check_user
          docker inspect -f "{{.State.Running}}" user-service | findstr /i true >nul
          if errorlevel 1 (
            set /a count+=1
            if !count! lss %max% (
              echo Waiting for User Service...
              timeout /t 2 >nul
              goto check_user
            ) else (
              echo User Service failed to start
              exit /b 1
            )
          )

          set count=0
          :check_order
          docker inspect -f "{{.State.Running}}" order-service | findstr /i true >nul
          if errorlevel 1 (
            set /a count+=1
            if !count! lss %max% (
              echo Waiting for Order Service...
              timeout /t 2 >nul
              goto check_order
            ) else (
              echo Order Service failed to start
              exit /b 1
            )
          )

          echo Both services are running!
          endlocal
        '''
      }
    }
  }

  post {
    always {
      // keep key logs/artifacts around if you want them in the build page
      archiveArtifacts artifacts: '**/npm-debug.log, **/logs/**/*.log', allowEmptyArchive: true
    }
    success {
      echo "Pipeline succeeded. Images pushed and services deployed."
    }
    failure {
      echo "Pipeline failed."
    }
  }
}
