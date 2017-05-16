﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace Kneesocks {
    internal class Stack<T> where T : Connection {
        private Pool<T> PoolRef = null;
        private List<T> Clients = new List<T>();
        private bool RunWithNoClients = false;
        private bool Running = true;

        public bool Finished { get; private set; } = false;

        public Stack(Pool<T> poolRef, T initialConnection = null) {
            PoolRef = poolRef;
            if(initialConnection != null)
                Clients.Add(initialConnection);
        }

        public Stack(Pool<T> poolRef, bool runWithNoClients, T initialConnection = null)
            : this(poolRef, initialConnection) 
        {
            RunWithNoClients = runWithNoClients;
        }

        public void AddClient(T client) {
            lock(Clients) {
                Clients.Add(client);
            }
        }

        public int Count {
            get {
                return Clients.Count;
            }
        }

        internal void StopThread() {
            Running = false;
        }

        private bool CheckIfConnected(T client) {
            return !client.Disconnected && !client.OutsidePool;
        }
        
        public void ManageStack() {
            while(Running && (Count > 0 || RunWithNoClients)) {
                lock(Clients) {
                    for(var i = Count - 1; i >= 0 && Running; --i) {
                        var client = Clients[i];
                        var connected = CheckIfConnected(client);

                        if(connected) {
                            try {
                                client.Parse();
                                if(CheckIfConnected(client))
                                    connected = false;
                            } catch {
                                connected = false;
                            }
                        }

                        if(!connected) {
                            PoolRef.InvalidateConnection(client.Id);
                            Clients.RemoveAt(i);
                        }
                    }
                }

                Thread.Sleep(10);
            }

            Finished = true;
            PoolRef.InvalidateThread(this);
        }
    }
}