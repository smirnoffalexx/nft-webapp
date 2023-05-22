package main

import (
	"context"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

var CLIENT *ethclient.Client
var FACTORY_ADDRESS string
var COLLECTIONS []string
var ABI map[string]abi.ABI
var EVENTS map[string][]map[string]interface{}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Error().Msg("Can't load env")
		os.Exit(1)
	}

	if err := loadABI(); err != nil {
		log.Error().Msg("Can't load abi")
		return
	}

	go initGinRoutes()

	EVENTS = make(map[string][]map[string]interface{})
	FACTORY_ADDRESS = os.Getenv("FACTORY_ADDRESS")
	CLIENT = connectNetwork()

	log.Info().Msg("Log process started")

	subscribeToEvents(FACTORY_ADDRESS)
}

func connectNetwork() *ethclient.Client {
	client, err := ethclient.Dial(os.Getenv("ALCHEMY_URL"))
	if err != nil {
		log.Error().Err(err).Msg("")
		log.Error().Msg("Retrying connectNetwork")

		time.Sleep(time.Millisecond * 500)

		return connectNetwork()
	}

	return client
}

func loadABI() error {
	files, err := ioutil.ReadDir("./abi")
	if err != nil {
		return err
	}

	ABI = make(map[string]abi.ABI)

	for _, file := range files {
		fileName := file.Name()
		b, err := os.ReadFile("./abi/" + fileName)
		if err != nil {
			return err
		}

		abi, err := abi.JSON(strings.NewReader(string(b)))
		if err != nil {
			log.Error().Err(err).Msg("")
		}

		ABI[strings.Split(fileName, ".")[0]] = abi
	}

	return nil
}

func processTxLog(vLog types.Log) error {
	contractAddress := vLog.Address.String()

	for contract, abi := range ABI {
		event, err := abi.EventByID(vLog.Topics[0])
		if err != nil {
			continue
		}

		outputMap := make(map[string]interface{})
		err = abi.UnpackIntoMap(outputMap, event.Name, vLog.Data)
		if err != nil {
			return err
		}

		outputMap["event"] = event.Name

		EVENTS[contractAddress] = append(EVENTS[contractAddress], outputMap)

		if contract == "CollectionFactory" {
			collectionAddress := outputMap["collection"].(common.Address).String()
			if !Contains(COLLECTIONS, collectionAddress) {
				COLLECTIONS = append(COLLECTIONS, collectionAddress)
				go subscribeToEvents(collectionAddress)
			}
		}
	}

	return nil
}

func subscribeToEvents(address string) {
	topics := make([][]common.Hash, 1)

	// Filter topics for Collection contracts (because mint emit 2 events: Transfer and TokenMinted)
	if address != FACTORY_ADDRESS {
		topics[0] = append(topics[0], common.HexToHash("0xc9fee7cd4889f66f10ff8117316524260a5242e88e25e0656dfb3f4196a21917"))
	}

	query := ethereum.FilterQuery{
		Addresses: []common.Address{common.HexToAddress(address)},
		Topics:    topics,
	}

	logs := make(chan types.Log)
	sub, err := CLIENT.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Error().Msg("Can't subscribe filter logs")
		return
	}

	for {
		select {
		case err := <-sub.Err():
			log.Err(err).Msg("Subscribe error")
		case vLog := <-logs:
			if err := processTxLog(vLog); err != nil {
				log.Err(err).Msg("Error occured while log process")
			}
		}
	}
}

func Contains[T comparable](s []T, e T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}

func initGinRoutes() {
	router := gin.Default()
	router.Use(CORSMiddleware())
	router.GET("/events", getEvents)
	router.GET("/events/:address", getContractEvents)

	router.Run("localhost:8080")
}

func getEvents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"events": EVENTS})
}

func getContractEvents(c *gin.Context) {
	address := c.Param("address")

	for contract, events := range EVENTS {
		if contract == address {
			c.JSON(http.StatusOK, gin.H{"events": events})
			return
		}
	}

	c.JSON(http.StatusOK, "No events with provided contract address")
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST,HEAD,PATCH, OPTIONS, GET, PUT")

		c.Next()
	}
}
