"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Car, Trash2, Fuel, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { vehicleService } from "@/services/supabase/vehicle";
import { authService } from "@/services/supabase/auth";
import { formatAmount, ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { Vehicle, FuelLog, MaintenanceLog } from "@/types/models";

export default function VehiculoPage() {
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [openFuel, setOpenFuel] = useState(false);
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const [vForm, setVForm] = useState({ brand: "", model: "", year: "", plate: "" });
  const [fForm, setFForm] = useState({ liters: "", price_per_liter: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0], odometer: "" });
  const [mForm, setMForm] = useState({ service_type: "aceite" as const, odometer: "", cost: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0], next_service_km: "", notes: "" });

  useEffect(() => {
    authService.getUser().then(async (u) => {
      if (!u) return;
      setUserId(u.id);
      const vehicles = await vehicleService.getAll(u.id);
      if (vehicles.length > 0) {
        setVehicle(vehicles[0]);
        const [fuel, maint] = await Promise.all([vehicleService.getFuelLogs(vehicles[0].id), vehicleService.getMaintenanceLogs(vehicles[0].id)]);
        setFuelLogs(fuel); setMaintenanceLogs(maint);
      }
      setLoading(false);
    });
  }, []);

  const handleCreateVehicle = async () => {
    if (!userId || !vForm.brand || !vForm.model || !vForm.year || !vForm.plate) { toast.error(t("errors.required")); return; }
    try {
      const v = await vehicleService.create({ user_id: userId, brand: vForm.brand, model: vForm.model, year: parseInt(vForm.year), plate: vForm.plate });
      setVehicle(v); setOpenVehicle(false); toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleAddFuel = async () => {
    if (!vehicle || !fForm.liters || !fForm.price_per_liter) { toast.error(t("errors.required")); return; }
    try {
      const liters = parseFloat(fForm.liters); const ppl = parseFloat(fForm.price_per_liter);
      const log = await vehicleService.addFuelLog({ vehicle_id: vehicle.id, liters, price_per_liter: ppl, currency_code: fForm.currency_code, date: fForm.date, odometer: fForm.odometer ? parseInt(fForm.odometer) : null });
      setFuelLogs([log, ...fuelLogs]); setOpenFuel(false);
      setFForm({ liters: "", price_per_liter: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0], odometer: "" });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleAddMaintenance = async () => {
    if (!vehicle || !mForm.odometer || !mForm.cost) { toast.error(t("errors.required")); return; }
    try {
      const log = await vehicleService.addMaintenanceLog({ vehicle_id: vehicle.id, service_type: mForm.service_type, odometer: parseInt(mForm.odometer), cost: parseFloat(mForm.cost), currency_code: mForm.currency_code, date: mForm.date, next_service_km: mForm.next_service_km ? parseInt(mForm.next_service_km) : null, notes: mForm.notes || null });
      setMaintenanceLogs([log, ...maintenanceLogs]); setOpenMaintenance(false);
      setMForm({ service_type: "aceite", odometer: "", cost: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0], next_service_km: "", notes: "" });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  if (loading) return <div className="space-y-3">{[1,2].map((n) => <Skeleton key={n} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("vehiculo.title")}</h1>
      {!vehicle ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground mb-4">{t("vehiculo.noVehicles")}</p>
            <Dialog open={openVehicle} onOpenChange={setOpenVehicle}>
              <DialogTrigger render={<Button style={{ backgroundColor: "#2E7D32" }} className="text-white" />}>
                <Plus size={16} className="mr-2" />{t("vehiculo.addVehicle")}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("vehiculo.addVehicle")}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>{t("vehiculo.brand")}</Label><Input value={vForm.brand} onChange={(e) => setVForm({ ...vForm, brand: e.target.value })} placeholder="Toyota" /></div>
                    <div><Label>{t("vehiculo.model")}</Label><Input value={vForm.model} onChange={(e) => setVForm({ ...vForm, model: e.target.value })} placeholder="Corolla" /></div>
                    <div><Label>{t("vehiculo.year")}</Label><Input type="number" value={vForm.year} onChange={(e) => setVForm({ ...vForm, year: e.target.value })} placeholder="2020" /></div>
                    <div><Label>{t("vehiculo.plate")}</Label><Input value={vForm.plate} onChange={(e) => setVForm({ ...vForm, plate: e.target.value })} placeholder="ABC-123" /></div>
                  </div>
                  <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleCreateVehicle}>{t("common.save")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Car size={24} /></div>
              <div>
                <p className="text-xl font-bold">{vehicle.brand} {vehicle.model}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{vehicle.year}</Badge>
                  <Badge variant="outline">{vehicle.plate}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto text-destructive" onClick={async () => { await vehicleService.delete(vehicle.id); setVehicle(null); setFuelLogs([]); setMaintenanceLogs([]); }}><Trash2 size={16} /></Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="fuel">
            <TabsList>
              <TabsTrigger value="fuel"><Fuel size={14} className="mr-1" />{t("vehiculo.fuelLog")}</TabsTrigger>
              <TabsTrigger value="maint"><Wrench size={14} className="mr-1" />{t("vehiculo.maintenanceLogs")}</TabsTrigger>
            </TabsList>
            <TabsContent value="fuel" className="space-y-3 pt-3">
              <div className="flex justify-end">
                <Dialog open={openFuel} onOpenChange={setOpenFuel}>
                  <DialogTrigger render={<Button size="sm" style={{ backgroundColor: "#2E7D32" }} className="text-white" />}><Plus size={14} className="mr-1" />{t("vehiculo.addFuelLog")}</DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("vehiculo.addFuelLog")}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>{t("vehiculo.liters")}</Label><Input type="number" value={fForm.liters} onChange={(e) => setFForm({ ...fForm, liters: e.target.value })} /></div>
                        <div><Label>{t("vehiculo.pricePerLiter")}</Label><Input type="number" value={fForm.price_per_liter} onChange={(e) => setFForm({ ...fForm, price_per_liter: e.target.value })} /></div>
                        <div><Label>Odómetro (km)</Label><Input type="number" value={fForm.odometer} onChange={(e) => setFForm({ ...fForm, odometer: e.target.value })} /></div>
                        <div><Label>{t("common.date")}</Label><Input type="date" value={fForm.date} onChange={(e) => setFForm({ ...fForm, date: e.target.value })} /></div>
                      </div>
                      <div><Label>{t("common.currency")}</Label>
                        <Select value={fForm.currency_code} onValueChange={(v) => v !== null && setFForm({ ...fForm, currency_code: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ISO_4217_CURRENCIES.slice(0, 10).map((c) => (<SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleAddFuel}>{t("common.save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {fuelLogs.length === 0 ? <p className="text-muted-foreground text-center py-8">Sin registros de combustible</p> : (
                <div className="divide-y border rounded-lg">
                  {fuelLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-3">
                      <div><p className="text-sm font-medium">{log.liters}L · {formatAmount(log.price_per_liter, log.currency_code)}/L</p><p className="text-xs text-muted-foreground">{log.date}{log.odometer ? ` · ${log.odometer} km` : ""}</p></div>
                      <div className="flex items-center gap-2"><span className="font-semibold">{formatAmount(log.total_cost, log.currency_code)}</span><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { await vehicleService.deleteFuelLog(log.id); setFuelLogs(fuelLogs.filter((l) => l.id !== log.id)); }}><Trash2 size={13} /></Button></div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="maint" className="space-y-3 pt-3">
              <div className="flex justify-end">
                <Dialog open={openMaintenance} onOpenChange={setOpenMaintenance}>
                  <DialogTrigger render={<Button size="sm" style={{ backgroundColor: "#2E7D32" }} className="text-white" />}><Plus size={14} className="mr-1" />{t("vehiculo.addMaintenance")}</DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("vehiculo.addMaintenance")}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div><Label>{t("vehiculo.serviceType")}</Label>
                        <Select value={mForm.service_type} onValueChange={(v) => v !== null && setMForm({ ...mForm, service_type: v as typeof mForm.service_type })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aceite">{t("vehiculo.serviceAceite")}</SelectItem>
                            <SelectItem value="llantas">{t("vehiculo.serviceLlantas")}</SelectItem>
                            <SelectItem value="revision_general">{t("vehiculo.serviceRevision")}</SelectItem>
                            <SelectItem value="otro">{t("vehiculo.serviceOtro")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Odómetro (km)</Label><Input type="number" value={mForm.odometer} onChange={(e) => setMForm({ ...mForm, odometer: e.target.value })} /></div>
                        <div><Label>Costo</Label><Input type="number" value={mForm.cost} onChange={(e) => setMForm({ ...mForm, cost: e.target.value })} /></div>
                        <div><Label>{t("common.date")}</Label><Input type="date" value={mForm.date} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} /></div>
                        <div><Label>Próximo servicio (km)</Label><Input type="number" value={mForm.next_service_km} onChange={(e) => setMForm({ ...mForm, next_service_km: e.target.value })} /></div>
                      </div>
                      <div><Label>Notas</Label><Input value={mForm.notes} onChange={(e) => setMForm({ ...mForm, notes: e.target.value })} /></div>
                      <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleAddMaintenance}>{t("common.save")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {maintenanceLogs.length === 0 ? <p className="text-muted-foreground text-center py-8">Sin registros de servicio</p> : (
                <div className="divide-y border rounded-lg">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{t(`vehiculo.service${log.service_type.charAt(0).toUpperCase()}${log.service_type.slice(1).replace("_general","Revision").replace("_general","Revision")}` as Parameters<typeof t>[0]) ?? log.service_type}</p>
                        <p className="text-xs text-muted-foreground">{log.date} · {log.odometer} km</p>
                      </div>
                      <div className="flex items-center gap-2"><span className="font-semibold">{formatAmount(log.cost, log.currency_code)}</span><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { await vehicleService.deleteMaintenanceLog(log.id); setMaintenanceLogs(maintenanceLogs.filter((l) => l.id !== log.id)); }}><Trash2 size={13} /></Button></div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
