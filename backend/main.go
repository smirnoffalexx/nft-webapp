package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

var CLIENT *ethclient.Client
var FACTORY_ADDRESS string
var COLLECTIONS []string
var ABI map[string]abi.ABI
var EVENTS map[string][]string

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

	EVENTS = make(map[string][]string)
	FACTORY_ADDRESS = os.Getenv("FACTORY_ADDRESS")
	CLIENT = connectNetwork()

	log.Info().Msg("Log process started")

	query := ethereum.FilterQuery{
		Addresses: []common.Address{common.HexToAddress(FACTORY_ADDRESS)},
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
			if err := processLog(vLog); err != nil {
				log.Err(err).Msg("Error occured while log process")
			}
		}
	}
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

func processLog(vLog types.Log) error {
	var abi abi.ABI
	var eventName string
	contractAddress := vLog.Address.String()

	if contractAddress == FACTORY_ADDRESS {
		abi = ABI["CollectionFactory"]
		eventName = "CollectionCreated"
	} else {
		abi = ABI["Collection"]
		eventName = "TokenMinted"
	}

	event := make(map[string]interface{})
	fmt.Println(vLog)
	fmt.Println("before unpack")
	err := abi.UnpackIntoMap(event, eventName, vLog.Data)
	if err != nil {
		fmt.Println("in unpack error")
		return err
	}

	rawEvent, err := json.Marshal(event)
	if err != nil {
		log.Error().Msg("Can't marshal event")
	}

	EVENTS[contractAddress] = append(EVENTS[contractAddress], string(rawEvent))
	fmt.Println(EVENTS)

	if contractAddress == FACTORY_ADDRESS {
		collectionAddress := event["collection"].(common.Address).String()
		if !Contains(COLLECTIONS, collectionAddress) {
			COLLECTIONS = append(COLLECTIONS, collectionAddress)
			go subscribeNewCollection(common.HexToAddress(collectionAddress))
		}
	}

	return nil
}

func subscribeNewCollection(address common.Address) {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{address},
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
			if err := processLog(vLog); err != nil {
				log.Err(err).Msg("Error occured while log process")
			}
		}
	}
}

// func subscribeNewContract(address string) {
// 	query := ethereum.FilterQuery{
// 		Addresses: []common.Address{address},
// 	}

// 	logs := make(chan types.Log)
// 	sub, err := CLIENT.SubscribeFilterLogs(context.Background(), query, logs)
// 	if err != nil {
// 		log.Error().Msg("Can't subscribe filter logs")
// 		return
// 	}

// 	for {
// 		select {
// 		case err := <-sub.Err():
// 			log.Err(err).Msg("Subscribe error")
// 		case vLog := <-logs:
// 			if err := processLog(vLog); err != nil {
// 				log.Err(err).Msg("Error occured while log process")
// 			}
// 		}
// 	}
// }

func Contains[T comparable](s []T, e T) bool {
	for _, v := range s {
		if v == e {
			return true
		}
	}
	return false
}
