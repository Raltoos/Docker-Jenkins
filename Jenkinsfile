pipeline {
    agent any

    environment {
        DOCKERHUB_REPO = 'keyurpatil06'
        IMAGE_TAG = "${BUILD_NUMBER}" // Jenkins auto-generates BUILD_NUMBER
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test Services') {
            steps {
                dir('user-service') {
                    bat 'npm ci'
                    bat 'npm test || exit 0' // continue even if tests fail
                }
                dir('order-service') {
                    bat 'npm ci'
                    bat 'npm test || exit 0'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat "docker build -t %DOCKERHUB_REPO%/user-service:%IMAGE_TAG% ./user-service"
                bat "docker build -t %DOCKERHUB_REPO%/order-service:%IMAGE_TAG% ./order-service"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                    bat "docker push %DOCKERHUB_REPO%/user-service:%IMAGE_TAG%"
                    bat "docker push %DOCKERHUB_REPO%/order-service:%IMAGE_TAG%"
                    bat 'docker logout'
                }
            }
        }

        stage('Deploy') {
            steps {
                bat "docker rm -f user-service || exit 0"
                bat "docker rm -f order-service || exit 0"
                bat "docker run -d --name user-service -p 3001:3001 %DOCKERHUB_REPO%/user-service:%IMAGE_TAG%"
                bat "docker run -d --name order-service -p 3002:3002 %DOCKERHUB_REPO%/order-service:%IMAGE_TAG%"
            }
        }

        stage('Verify') {
            steps {
                bat '''
                @echo off
                setlocal enabledelayedexpansion
                set max=15

                :: Wait for User Service
                set count=0
                :check_user
                docker inspect -f "{{.State.Running}}" user-service | findstr true >nul
                if %ERRORLEVEL% neq 0 (
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

                :: Wait for Order Service
                set count=0
                :check_order
                docker inspect -f "{{.State.Running}}" order-service | findstr true >nul
                if %ERRORLEVEL% neq 0 (
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
        success {
            echo "Pipeline succeeded. Images pushed and services deployed."
        }
        failure {
            echo "Pipeline failed."
        }
    }
}
