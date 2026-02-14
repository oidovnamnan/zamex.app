'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    Truck,
    ShieldCheck,
    QrCode,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    MapPin,
    Globe,
    DollarSign,
    Layers,
    AlertCircle
} from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Ачаа хүлээн авах",
        subtitle: "Global Warehousing",
        desc: "Хятадын аль ч хот (Гуанжоу, Эрээн г.м) дахь агуулахад ачааг бүртгэж авах. Баркод уншуулж, зураг болон нөхцөл байдлыг системд оруулна.",
        icon: Package,
        color: "bg-blue-500",
        details: ["Олон хотын дэмжлэг", "Баркод сканер", "Зургийн баримтжуулалт"]
    },
    {
        id: 2,
        title: "Уян хатан үнэ тогтоолт",
        subtitle: "Super Admin Control",
        desc: "Юанийн үнийг Супер Админы тогтоосон өдрийн ханшаар автоматаар Төгрөг рүү хөрвүүлнэ. Жин болон овор хэмжээнээс хамаарч үнэ бодогдоно.",
        icon: DollarSign,
        color: "bg-emerald-500",
        details: ["Нэгдсэн CNY ханш", "Автомат хөрвүүлэлт", "Үнийн дүрмийн тохиргоо"]
    },
    {
        id: 3,
        title: "Багцлалт ба Тээвэрлэлт",
        subtitle: "Smart Consolidation",
        desc: "Ачаануудыг нэгтгэн багцалж, тээврийн багцад (Batch) онооно. Жолооч томилогдож, замын явцыг GPS-ээр шууд хянана.",
        icon: Truck,
        color: "bg-indigo-500",
        details: ["GPS шууд хяналт", "Жолооч оноолт", "Дуудлага худалдааны систем"]
    },
    {
        id: 4,
        title: "Дижитал Гааль",
        subtitle: "QR Manifest System",
        desc: "Гаалийн байцаагч нарт зориулсан тусгай QR манифест үүснэ. Хил дээр ачааг цаасан бичиггүйгээр онлайнаар шалгах боломжтой.",
        icon: QrCode,
        color: "bg-amber-500",
        details: ["Аюулгүй токен", "Нийтийн аудитын хандалт", "Шуурхай төлөв шинэчлэл"]
    },
    {
        id: 5,
        title: "Төв агуулах ба Түгээлт",
        subtitle: "Final Mile Readiness",
        desc: "Ачаа Улаанбаатар эсвэл орон нутгийн төв агуулахуудад ирж бууна. Автоматаар тавиур оноож, хэрэглэгчид мэдэгдэл очино.",
        icon: MapPin,
        color: "bg-rose-500",
        details: ["Бүсийн Хаб систем", "Тавиурын бүртгэл", "Ирсэн мэдэгдэл"]
    },
    {
        id: 6,
        title: "Нэхэмжлэх ба Төлбөр",
        subtitle: "Automated Finance",
        desc: "Тээвэр, гааль, НӨАТ орсон нэхэмжлэх автоматаар үүснэ. QPay систем болон И-Баримт татварын системтэй бүрэн холбогдсон.",
        icon: CreditCard,
        color: "bg-cyan-500",
        details: ["QPay шууд төлбөр", "Автомат И-Баримт", "Санхүүгийн нэгдсэн бүртгэл"]
    },
    {
        id: 7,
        title: "Ачаа олголт",
        subtitle: "Secure Delivery",
        desc: "Ажилтан шошгыг уншуулж төлбөрийн үлдэгдлийг шалгана. Зөвхөн төлбөр төлөгдсөн ачааг хэрэглэгчид хүлээлгэн өгөх боломжтой.",
        icon: CheckCircle2,
        color: "bg-green-500",
        details: ["Төлбөрийн хяналт", "Сканердаж олгох", "Захиалга автоматаар хаагдах"]
    },
    {
        id: 8,
        title: "Буцаалт ба Zamex Shield",
        subtitle: "Returns & Protection Engine",
        desc: "Гэмтэлтэй болон дутуу ачаанд хариуцлагыг автоматаар онооно. Zamex Shield-ийн нөхөн төлбөр болон И-Баримт цуцлалтыг систем зохицуулна.",
        icon: ShieldCheck,
        color: "bg-violet-500",
        details: ["Automated Liability", "Zamex Shield Sync", "Unified Return Audit"]
    }
];

export default function AuditInfographicPage() {
    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 p-8 font-inter">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4"
                    >
                        <Layers className="w-3 h-3" />
                        Системийн архитектур v2.0
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl font-black text-white mb-4 tracking-tight"
                    >
                        Zamex <span className="text-blue-500">Системийн Аудит</span>
                    </motion.h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Замекс логистик болон санхүүгийн системийн төгсгөл хүртэлх цогц процесс.
                        Ачаа хүлээн авахаас эцсийн хэрэглэгчийн гарт очих хүртэлх бүх дамжлага.
                    </p>
                </header>

                {/* The Flow */}
                <div className="relative">
                    {/* Connecting Line (Background) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/50 to-emerald-500/50 hidden lg:block -translate-x-1/2 z-0 opacity-20" />

                    <div className="grid grid-cols-1 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Content Card */}
                                <div className="flex-1 w-full">
                                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[40px] shadow-2xl hover:border-slate-600 transition-all group">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <step.icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
                                                    <p className="text-blue-400 font-medium text-sm">{step.subtitle}</p>
                                                </div>
                                            </div>
                                            <span className="text-4xl font-black text-slate-800 group-hover:text-blue-500/20 transition-colors">0{step.id}</span>
                                        </div>

                                        <p className="text-slate-400 leading-relaxed mb-6">
                                            {step.desc}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {step.details.map((detail, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-700/50 rounded-full text-xs font-semibold text-slate-300 border border-slate-600/30">
                                                    {detail}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Connecting Arrow (For Desktop) */}
                                <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-slate-900 border border-slate-800 rounded-full text-blue-500 shadow-xl relative z-20">
                                    <ArrowRight className={`w-6 h-6 ${index % 2 !== 0 ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Spacer for visual balance */}
                                <div className="flex-1 hidden lg:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer Security Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-24 p-8 rounded-[40px] bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 text-center"
                >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Аудитын баталгаажуулалт амжилттай</h2>
                    <p className="text-slate-400 max-w-xl mx-auto mb-0">
                        Энэхүү систем нь Монгол Улсын татварын хууль тогтоомж, олон улсын ложистикийн стандарт, аюулгүй төлбөр тооцооны протоколын дагуу бүрэн хянагдаж баталгаажсан болно.
                    </p>
                </motion.div>

                <footer className="mt-16 pb-16 text-center text-slate-500 text-sm">
                    &copy; 2026 Zamex Advanced Logistics Platform. All Rights Reserved.
                </footer>
            </div>
        </div>
    );
}
